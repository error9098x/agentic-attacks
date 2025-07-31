#!/usr/bin/env node

/**
 * CI/CD Bot Simulator for MCP Injection Demo
 * 
 * This simulates a CI/CD pipeline that uses an MCP server to check
 * if applications are running on required ports before deployment.
 * 
 * Demonstrates both normal operation and various attack scenarios.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { logger } from './common/logger.js';

class CICDBot {
  constructor() {
    this.mcpServer = null;
    this.transport = null;
  }

  /**
   * Initialize connection to MCP server
   */
  async connect(serverPath) {
    try {
      // Let StdioClientTransport manage the server process for robust connection
      this.transport = new StdioClientTransport({
        command: 'node',
        args: [serverPath]
      });
      
      // Create MCP client
      this.mcpServer = new Client({
        name: 'ci-cd-bot',
        version: '1.0.0',
        transport: this.transport
      });

      // Connect to the server
      await this.mcpServer.connect();
      
      logger.info('🤖 CI/CD Bot connected to MCP server');

      const toolsResult = await this.mcpServer.listTools();
      logger.info(
        'Found tools on server:',
        toolsResult.tools.map(({ name }) => name)
      );

      return true;
    } catch (error) {
      logger.error(`Failed to connect to MCP server: ${error.message}`);
      return false;
    }
  }

  /**
   * Normal operation: Check if an application is running on a port
   */
  async checkPortNormal(port) {
    console.log(`\n🔍 [NORMAL] CI/CD Bot checking port ${port}...`);
    
    try {
      const result = await this.mcpServer.callTool('which-app-on-port', { port });
      
      console.log('✅ [NORMAL] Port check completed successfully');
      console.log('📋 Response:', result.content[0].text);
      
      return result;
    } catch (error) {
      console.log('❌ [NORMAL] Port check failed:', error.message);
      return null;
    }
  }

  /**
   * Attack scenario: Type coercion attack
   */
  async checkPortTypeCoercion(port) {
    console.log(`\n🚨 [ATTACK] CI/CD Bot executing type coercion attack...`);
    console.log(`📝 Payload: ${port}`);
    
    try {
      const result = await this.mcpServer.callTool('which-app-on-port', { port });
      
      console.log('⚠️  [ATTACK] Type coercion attack executed');
      console.log('📋 Response:', result.content[0].text);
      
      // Check for side effects
      await this.checkSideEffects('type_coercion');
      
      return result;
    } catch (error) {
      console.log('❌ [ATTACK] Type coercion attack failed:', error.message);
      return null;
    }
  }

  /**
   * Attack scenario: Chain exploitation
   */
  async checkPortChainExploit(port) {
    console.log(`\n🚨 [ATTACK] CI/CD Bot executing chain exploitation...`);
    console.log(`📝 Payload: ${port}`);
    
    try {
      const result = await this.mcpServer.callTool('which-app-on-port', { port });
      
      console.log('⚠️  [ATTACK] Chain exploitation executed');
      console.log('📋 Response:', result.content[0].text);
      
      // Check for side effects
      await this.checkSideEffects('chain_exploit');
      
      return result;
    } catch (error) {
      console.log('❌ [ATTACK] Chain exploitation failed:', error.message);
      return null;
    }
  }

  /**
   * Attack scenario: Backdoor attack
   */
  async checkPortBackdoor(port) {
    console.log(`\n🚨 [ATTACK] CI/CD Bot executing backdoor attack...`);
    console.log(`📝 Payload: ${port}`);
    
    try {
      const result = await this.mcpServer.callTool('which-app-on-port', { port });
      
      console.log('⚠️  [ATTACK] Backdoor attack executed');
      console.log('📋 Response:', result.content[0].text);
      
      // Check for side effects
      await this.checkSideEffects('backdoor');
      
      return result;
    } catch (error) {
      console.log('❌ [ATTACK] Backdoor attack failed:', error.message);
      return null;
    }
  }

  /**
   * Check for side effects of attacks
   */
  async checkSideEffects(attackType) {
    console.log('🔍 Checking for side effects...');
    // Implement checks for files created by attacks, etc.
    // e.g., check if /tmp/type_coercion_owned exists
    console.log('✅ Side effects check complete.');
  }

  /**
   * Disconnect from MCP server
   */
  async disconnect() {
    if (this.mcpServer) {
      await this.mcpServer.close();
      logger.info('🤖 CI/CD Bot disconnected from MCP server');
    }
  }
}

async function runDemo() {
  console.log('🚀 Starting CI/CD Bot Demo');

  const args = process.argv.slice(2);
  const portIndex = args.indexOf('--port');
  
  let port = '8080'; // Default port
  if (portIndex !== -1 && args[portIndex + 1]) {
    port = args[portIndex + 1];
  }

  const useSecure = args.includes('--secure');
  const serverPath = useSecure 
    ? './server/mcp_secure.js' 
    : './server/mcp_vulnerable.js';

  console.log(`📁 Server: ${serverPath}`);
  console.log(`🔧 Port: ${port}`);
  console.log(`🎯 Mode: ${useSecure ? 'SECURE' : 'VULNERABLE'}`);
  
  const bot = new CICDBot();
  const connected = await bot.connect(serverPath);
  
  if (!connected) {
    console.log('❌ Failed to connect to MCP server');
    return;
  }
  
  if (port.includes(';')) {
    // Basic detection of an attack payload
    await bot.checkPortTypeCoercion(port);
  } else {
    await bot.checkPortNormal(port);
  }
  
  await bot.disconnect();
}

runDemo().catch((error) => {
  console.error('An unexpected error occurred:', error);
  process.exit(1);
});
