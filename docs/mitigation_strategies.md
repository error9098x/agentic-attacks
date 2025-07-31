# Mitigation Strategies for Command Injection Vulnerabilities

## 🛡️ Overview

This document provides comprehensive mitigation strategies for preventing command injection vulnerabilities in MCP servers and CI/CD environments. These strategies are based on industry best practices and real-world security requirements.

## 🔒 Defense-in-Depth Approach

### Layer 1: Input Validation
**Purpose:** Prevent malicious input from reaching execution

#### 1.1 Type Validation
```javascript
// BAD: No type validation
function checkPort(port) {
  exec(`lsof -t -i tcp:${port}`);
}

// GOOD: Strong type validation
function checkPort(port) {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Invalid port number');
  }
  execFile('lsof', ['-t', '-i', `tcp:${port}`]);
}
```

#### 1.2 Range Validation
```javascript
// Validate port ranges
const isValidPort = (port) => {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
};

// Validate string lengths
const isValidString = (str) => {
  return typeof str === 'string' && str.length > 0 && str.length <= 1000;
};
```

#### 1.3 Pattern Validation
```javascript
// Use regex patterns to validate input
const PORT_PATTERN = /^\d{1,5}$/;
const PID_PATTERN = /^\d+$/;

const isValidPort = (port) => {
  return PORT_PATTERN.test(port.toString());
};

const isValidPID = (pid) => {
  return PID_PATTERN.test(pid.toString());
};
```

#### 1.4 Whitelist Validation
```javascript
// Define allowed values
const ALLOWED_COMMANDS = ['lsof', 'ps', 'netstat'];
const ALLOWED_FLAGS = ['-t', '-i', '-p', '-o'];

const isValidCommand = (command) => {
  return ALLOWED_COMMANDS.includes(command);
};

const isValidFlag = (flag) => {
  return ALLOWED_FLAGS.includes(flag);
};
```

### Layer 2: Secure Command Execution
**Purpose:** Use secure alternatives to vulnerable functions

#### 2.1 Use execFile Instead of exec
```javascript
// BAD: Vulnerable to command injection
const { exec } = require('child_process');
exec(`lsof -t -i tcp:${port}`);

// GOOD: Secure command execution
const { execFile } = require('child_process');
execFile('lsof', ['-t', '-i', `tcp:${port}`]);
```

#### 2.2 Argument Arrays
```javascript
// BAD: String concatenation
const command = `lsof -t -i tcp:${port}`;
exec(command);

// GOOD: Argument arrays
const args = ['-t', '-i', `tcp:${port}`];
execFile('lsof', args);
```

#### 2.3 Parameterized Commands
```javascript
// Create safe command execution wrapper
class SafeCommandExecutor {
  constructor() {
    this.allowedCommands = new Set(['lsof', 'ps', 'netstat']);
  }

  async execute(command, args = []) {
    if (!this.allowedCommands.has(command)) {
      throw new Error(`Command not allowed: ${command}`);
    }

    // Validate all arguments
    for (const arg of args) {
      if (typeof arg !== 'string' || arg.includes(';') || arg.includes('&')) {
        throw new Error(`Invalid argument: ${arg}`);
      }
    }

    return execFile(command, args);
  }
}
```

### Layer 3: Output Validation
**Purpose:** Validate command outputs before reuse

#### 3.1 PID Validation
```javascript
// Validate PID before using in another command
const pid = pidStdout.trim();

// Check if PID is numeric
if (!/^\d+$/.test(pid)) {
  throw new Error('Invalid process ID returned');
}

// Check if PID is reasonable
const pidNum = parseInt(pid);
if (pidNum < 1 || pidNum > 999999) {
  throw new Error('PID out of reasonable range');
}
```

#### 3.2 Content Validation
```javascript
// Validate command output content
const validateOutput = (output) => {
  // Check for dangerous patterns
  const dangerousPatterns = [
    /[;&|`$(){}[\]]/,  // Shell metacharacters
    /\.\./,            // Directory traversal
    /\/etc\/passwd/,   // Sensitive files
    /\/proc\//,        // Process information
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(output)) {
      throw new Error('Dangerous content detected in output');
    }
  }

  return output;
};
```

### Layer 4: Monitoring and Detection
**Purpose:** Detect and respond to attack attempts

#### 4.1 Comprehensive Logging
```javascript
// Log all command executions
const logger = require('winston');

const logCommandExecution = (command, args, result) => {
  logger.info('Command executed', {
    command,
    args,
    result: result ? 'success' : 'failure',
    timestamp: new Date().toISOString(),
    user: process.env.USER,
    pid: process.pid
  });
};
```

#### 4.2 Suspicious Pattern Detection
```javascript
// Detect suspicious command patterns
const detectSuspiciousPatterns = (input) => {
  const suspiciousPatterns = [
    /[;&|`$(){}[\]]/,  // Shell metacharacters
    /\.\./,            // Directory traversal
    /\/tmp\/.*\.sh/,   // Shell scripts in /tmp
    /curl\s+http/,     // Outbound connections
    /wget\s+http/,     // Outbound connections
    /nc\s+/,           // Netcat
    /bash\s+-i/,       // Interactive shell
  ];

  const matches = suspiciousPatterns.filter(pattern => pattern.test(input));
  
  if (matches.length > 0) {
    logger.warn('Suspicious pattern detected', {
      input,
      patterns: matches.map(p => p.source),
      timestamp: new Date().toISOString()
    });
    return true;
  }

  return false;
};
```

#### 4.3 Rate Limiting
```javascript
// Implement rate limiting for command execution
class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  isAllowed(identifier) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Clean old entries
    for (const [key, timestamp] of this.requests.entries()) {
      if (timestamp < windowStart) {
        this.requests.delete(key);
      }
    }

    // Check current requests
    const currentRequests = Array.from(this.requests.values())
      .filter(timestamp => timestamp >= windowStart).length;

    if (currentRequests >= this.maxRequests) {
      return false;
    }

    this.requests.set(identifier, now);
    return true;
  }
}
```

## 🛠️ Implementation Guidelines

### 1. Code Review Checklist
- [ ] All user input is validated
- [ ] No string interpolation in command execution
- [ ] execFile is used instead of exec
- [ ] Arguments are passed as arrays
- [ ] Output is validated before reuse
- [ ] Comprehensive logging is implemented
- [ ] Error handling is secure
- [ ] Rate limiting is in place

### 2. Security Testing
```javascript
// Automated security tests
describe('Command Injection Prevention', () => {
  test('should reject shell metacharacters', async () => {
    const maliciousInputs = [
      '8080; touch /tmp/evil; #',
      '8080 && whoami',
      '8080 | cat /etc/passwd',
      '8080; $(whoami); #',
      '8080; `id`; #'
    ];

    for (const input of maliciousInputs) {
      await expect(checkPort(input)).rejects.toThrow();
    }
  });

  test('should accept valid input', async () => {
    const validInputs = [80, 443, 8080, 3000];
    
    for (const input of validInputs) {
      await expect(checkPort(input)).resolves.not.toThrow();
    }
  });
});
```

### 3. Configuration Management
```javascript
// Security configuration
const securityConfig = {
  allowedCommands: ['lsof', 'ps', 'netstat'],
  allowedFlags: ['-t', '-i', '-p', '-o'],
  maxCommandLength: 1000,
  maxArguments: 10,
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000
  },
  logging: {
    level: 'info',
    includeSensitiveData: false
  }
};
```

## 🔍 Detection and Response

### 1. Real-time Monitoring
```javascript
// Real-time command monitoring
const monitorCommands = (command, args) => {
  // Log all commands
  logger.info('Command executed', { command, args });

  // Check for suspicious patterns
  const fullCommand = `${command} ${args.join(' ')}`;
  if (detectSuspiciousPatterns(fullCommand)) {
    // Alert security team
    alertSecurityTeam({
      type: 'suspicious_command',
      command: fullCommand,
      timestamp: new Date().toISOString()
    });
  }
};
```

### 2. Alerting System
```javascript
// Security alerting
const alertSecurityTeam = (alert) => {
  // Send to security monitoring system
  securityMonitoringSystem.send(alert);
  
  // Send email/SMS alerts
  if (alert.severity === 'high') {
    sendEmergencyAlert(alert);
  }
  
  // Log to security log
  securityLogger.warn('Security alert', alert);
};
```

### 3. Incident Response
```javascript
// Incident response procedures
const handleSecurityIncident = (incident) => {
  // 1. Immediate containment
  blockSuspiciousIPs(incident.sourceIPs);
  disableAffectedServices(incident.services);
  
  // 2. Investigation
  collectEvidence(incident);
  analyzeAttackVector(incident);
  
  // 3. Remediation
  patchVulnerabilities(incident.vulnerabilities);
  updateSecurityControls(incident.controls);
  
  // 4. Recovery
  restoreServices(incident.services);
  verifySecurity(incident);
};
```

## 📊 Security Metrics

### 1. Vulnerability Metrics
- **Detection rate** - Percentage of attacks detected
- **Prevention rate** - Percentage of attacks prevented
- **Response time** - Time to detect and respond to attacks
- **False positive rate** - Percentage of false alarms

### 2. Implementation Metrics
- **Code coverage** - Percentage of code with security controls
- **Test coverage** - Percentage of security tests passing
- **Deployment rate** - Percentage of systems with security controls
- **Update frequency** - Frequency of security updates

### 3. Operational Metrics
- **Alert volume** - Number of security alerts per day
- **Incident count** - Number of security incidents per month
- **Resolution time** - Time to resolve security incidents
- **Recovery time** - Time to recover from security incidents

## 🎯 Best Practices Summary

### 1. Input Validation
- **Always validate input** - Never trust user input
- **Use strong typing** - Enforce data types and ranges
- **Implement whitelisting** - Only allow known good values
- **Validate at boundaries** - Validate at system boundaries

### 2. Secure Execution
- **Use execFile** - Prefer execFile over exec
- **Pass arguments as arrays** - Avoid string concatenation
- **Avoid shell interpretation** - Don't use shell interpretation
- **Run with least privilege** - Use minimal required privileges

### 3. Monitoring and Detection
- **Log everything** - Log all security-relevant events
- **Monitor patterns** - Detect suspicious patterns
- **Alert on anomalies** - Alert on unusual activities
- **Respond quickly** - Respond to incidents quickly

### 4. Continuous Improvement
- **Regular reviews** - Conduct regular security reviews
- **Update controls** - Update security controls regularly
- **Train teams** - Provide security training
- **Test defenses** - Regularly test security defenses

---

**Remember: Security is not a one-time effort. It requires continuous attention and improvement.** 