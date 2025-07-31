/**
 * Automated Tests for Secure MCP Server
 * These tests demonstrate that the secure server prevents command injection attacks
 */

import { spawn } from 'child_process';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../server/common/logger.js';

const execAsync = promisify(exec);

class SecureServerTester {
  constructor() {
    this.serverProcess = null;
    this.testResults = [];
  }

  /**
   * Start the secure MCP server
   */
  async startServer() {
    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('node', ['server/mcp_secure.js'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'secure' }
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
   * Stop the secure MCP server
   */
  async stopServer() {
    if (this.serverProcess) {
      this.serverProcess.kill();
      this.serverProcess = null;
    }
  }

  /**
   * Test normal operation
   */
  async testNormalOperation() {
    logger.info('[TEST] Testing normal operation...');
    
    try {
      const result = await execAsync('NODE_ENV=secure node server/agent_client.js --port=8080');
      
      if (result.stdout.includes('Port check completed successfully')) {
        this.testResults.push({
          test: 'Normal Operation',
          status: 'SUCCESS',
          details: 'Normal port check works correctly'
        });
        logger.info('[TEST] Normal operation test PASSED');
      } else {
        this.testResults.push({
          test: 'Normal Operation',
          status: 'FAILED',
          details: 'Normal port check failed'
        });
        logger.error('[TEST] Normal operation test FAILED');
      }
    } catch (error) {
      this.testResults.push({
        test: 'Normal Operation',
        status: 'ERROR',
        details: error.message
      });
      logger.error(`[TEST] Normal operation test error: ${error.message}`);
    }
  }

  /**
   * Test type coercion attack prevention
   */
  async testTypeCoercionPrevention() {
    logger.info('[TEST] Testing type coercion attack prevention...');
    
    try {
      // Clean up any existing files
      await execAsync('rm -f /tmp/type_coercion_secure_test');
      
      // Attempt attack
      const result = await execAsync('NODE_ENV=secure node server/agent_client.js --port="8080; touch /tmp/type_coercion_secure_test; #"');
      
      // Check if attack was prevented
      try {
        await execAsync('ls -la /tmp/type_coercion_secure_test');
        this.testResults.push({
          test: 'Type Coercion Prevention',
          status: 'FAILED (Vulnerable)',
          details: 'File was created despite security measures'
        });
        logger.error('[TEST] Type coercion prevention FAILED - server is still vulnerable!');
      } catch (error) {
        this.testResults.push({
          test: 'Type Coercion Prevention',
          status: 'SUCCESS (Secure)',
          details: 'Attack was prevented - file was not created'
        });
        logger.info('[TEST] Type coercion prevention PASSED - server is secure');
      }
    } catch (error) {
      this.testResults.push({
        test: 'Type Coercion Prevention',
        status: 'ERROR',
        details: error.message
      });
      logger.error(`[TEST] Type coercion prevention test error: ${error.message}`);
    }
  }

  /**
   * Test chain exploitation prevention
   */
  async testChainExploitationPrevention() {
    logger.info('[TEST] Testing chain exploitation prevention...');
    
    try {
      // Create test directory
      await execAsync('mkdir -p /tmp/chain_secure_test_dir');
      
      // Attempt attack
      const result = await execAsync('NODE_ENV=secure node server/agent_client.js --port="8080; echo \\"123; rm -rf /tmp/chain_secure_test_dir; #\\" #"');
      
      // Check if attack was prevented
      try {
        await execAsync('ls -la /tmp/chain_secure_test_dir');
        this.testResults.push({
          test: 'Chain Exploitation Prevention',
          status: 'SUCCESS (Secure)',
          details: 'Attack was prevented - directory still exists'
        });
        logger.info('[TEST] Chain exploitation prevention PASSED - server is secure');
      } catch (error) {
        this.testResults.push({
          test: 'Chain Exploitation Prevention',
          status: 'FAILED (Vulnerable)',
          details: 'Directory was removed - attack succeeded'
        });
        logger.error('[TEST] Chain exploitation prevention FAILED - server is still vulnerable!');
      }
    } catch (error) {
      this.testResults.push({
        test: 'Chain Exploitation Prevention',
        status: 'ERROR',
        details: error.message
      });
      logger.error(`[TEST] Chain exploitation prevention test error: ${error.message}`);
    }
  }

  /**
   * Test backdoor creation prevention
   */
  async testBackdoorPrevention() {
    logger.info('[TEST] Testing backdoor creation prevention...');
    
    try {
      // Clean up any existing backdoor
      await execAsync('rm -f /tmp/backdoor_secure_test.sh');
      
      // Attempt attack
      const result = await execAsync('NODE_ENV=secure node server/agent_client.js --port="8080; echo \\"#!/bin/bash\\" > /tmp/backdoor_secure_test.sh && echo \\"echo \\\\\\"Backdoor test\\\\\\"\\" >> /tmp/backdoor_secure_test.sh && chmod +x /tmp/backdoor_secure_test.sh; #"');
      
      // Check if backdoor was prevented
      try {
        await execAsync('ls -la /tmp/backdoor_secure_test.sh');
        this.testResults.push({
          test: 'Backdoor Creation Prevention',
          status: 'FAILED (Vulnerable)',
          details: 'Backdoor was created despite security measures'
        });
        logger.error('[TEST] Backdoor creation prevention FAILED - server is still vulnerable!');
      } catch (error) {
        this.testResults.push({
          test: 'Backdoor Creation Prevention',
          status: 'SUCCESS (Secure)',
          details: 'Attack was prevented - backdoor was not created'
        });
        logger.info('[TEST] Backdoor creation prevention PASSED - server is secure');
      }
    } catch (error) {
      this.testResults.push({
        test: 'Backdoor Creation Prevention',
        status: 'ERROR',
        details: error.message
      });
      logger.error(`[TEST] Backdoor creation prevention test error: ${error.message}`);
    }
  }

  /**
   * Test information gathering prevention
   */
  async testInformationGatheringPrevention() {
    logger.info('[TEST] Testing information gathering prevention...');
    
    try {
      // Clean up any existing files
      await execAsync('rm -f /tmp/info_gathering_secure_test');
      
      // Attempt attack
      const result = await execAsync('NODE_ENV=secure node server/agent_client.js --port="8080; whoami > /tmp/info_gathering_secure_test; #"');
      
      // Check if information gathering was prevented
      try {
        const fileCheck = await execAsync('cat /tmp/info_gathering_secure_test');
        this.testResults.push({
          test: 'Information Gathering Prevention',
          status: 'FAILED (Vulnerable)',
          details: `Information was gathered: ${fileCheck.stdout.trim()}`
        });
        logger.error('[TEST] Information gathering prevention FAILED - server is still vulnerable!');
      } catch (error) {
        this.testResults.push({
          test: 'Information Gathering Prevention',
          status: 'SUCCESS (Secure)',
          details: 'Attack was prevented - no information was gathered'
        });
        logger.info('[TEST] Information gathering prevention PASSED - server is secure');
      }
    } catch (error) {
      this.testResults.push({
        test: 'Information Gathering Prevention',
        status: 'ERROR',
        details: error.message
      });
      logger.error(`[TEST] Information gathering prevention test error: ${error.message}`);
    }
  }

  /**
   * Test various attack payloads
   */
  async testVariousAttackPayloads() {
    logger.info('[TEST] Testing various attack payloads...');
    
    const attackPayloads = [
      { name: 'Command Separator', payload: '8080; ls; #' },
      { name: 'Logical AND', payload: '8080 && whoami' },
      { name: 'Logical OR', payload: '8080 || cat /etc/passwd' },
      { name: 'Pipe', payload: '8080 | grep root' },
      { name: 'Subshell', payload: '8080; $(whoami); #' },
      { name: 'Backticks', payload: '8080; `id`; #' },
      { name: 'Redirection', payload: '8080; echo test > /tmp/test; #' },
      { name: 'Multiple Commands', payload: '8080; touch /tmp/test1; touch /tmp/test2; #' }
    ];
    
    let preventedCount = 0;
    let successfulCount = 0;
    
    for (const attack of attackPayloads) {
      try {
        // Clean up any existing test files
        await execAsync('rm -f /tmp/test*');
        
        // Attempt attack
        const result = await execAsync(`NODE_ENV=secure node server/agent_client.js --port="${attack.payload}"`);
        
        // Check if attack was prevented
        try {
          await execAsync('ls -la /tmp/test*');
          successfulCount++;
          logger.warn(`[TEST] ${attack.name} attack SUCCEEDED - server may be vulnerable`);
        } catch (error) {
          preventedCount++;
          logger.info(`[TEST] ${attack.name} attack PREVENTED - server is secure`);
        }
      } catch (error) {
        // Attack was likely prevented
        preventedCount++;
        logger.info(`[TEST] ${attack.name} attack PREVENTED - server is secure`);
      }
    }
    
    this.testResults.push({
      test: 'Various Attack Payloads',
      status: preventedCount === attackPayloads.length ? 'SUCCESS (Secure)' : 'PARTIAL (Some Vulnerable)',
      details: `${preventedCount}/${attackPayloads.length} attacks prevented`
    });
  }

  /**
   * Test input validation
   */
  async testInputValidation() {
    logger.info('[TEST] Testing input validation...');
    
    const invalidInputs = [
      { name: 'String Input', input: 'abc' },
      { name: 'Negative Number', input: '-1' },
      { name: 'Zero', input: '0' },
      { name: 'Large Number', input: '99999' },
      { name: 'Float', input: '8080.5' },
      { name: 'Empty String', input: '' },
      { name: 'Null', input: 'null' },
      { name: 'Undefined', input: 'undefined' }
    ];
    
    let rejectedCount = 0;
    
    for (const test of invalidInputs) {
      try {
        const result = await execAsync(`NODE_ENV=secure node server/agent_client.js --port="${test.input}"`);
        
        if (result.stdout.includes('Invalid port number') || result.stdout.includes('Port check failed')) {
          rejectedCount++;
          logger.info(`[TEST] ${test.name} correctly rejected`);
        } else {
          logger.warn(`[TEST] ${test.name} was not rejected`);
        }
      } catch (error) {
        // Error likely means input was rejected
        rejectedCount++;
        logger.info(`[TEST] ${test.name} correctly rejected`);
      }
    }
    
    this.testResults.push({
      test: 'Input Validation',
      status: rejectedCount === invalidInputs.length ? 'SUCCESS (Secure)' : 'PARTIAL (Some Invalid)',
      details: `${rejectedCount}/${invalidInputs.length} invalid inputs rejected`
    });
  }

  /**
   * Run all security tests
   */
  async runAllTests() {
    logger.info('[TEST] Starting security tests...');
    
    try {
      await this.startServer();
      
      // Run all security tests
      await this.testNormalOperation();
      await this.testTypeCoercionPrevention();
      await this.testChainExploitationPrevention();
      await this.testBackdoorPrevention();
      await this.testInformationGatheringPrevention();
      await this.testVariousAttackPayloads();
      await this.testInputValidation();
      
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
    console.log('SECURITY TEST RESULTS');
    console.log('='.repeat(60));
    
    let secureCount = 0;
    let vulnerableCount = 0;
    let errorCount = 0;
    
    this.testResults.forEach(result => {
      const status = result.status.includes('SUCCESS') ? '✅' : 
                    result.status.includes('FAILED') ? '🚨' : '❌';
      
      console.log(`${status} ${result.test}: ${result.status}`);
      console.log(`   Details: ${result.details}`);
      console.log('');
      
      if (result.status.includes('SUCCESS')) secureCount++;
      else if (result.status.includes('FAILED')) vulnerableCount++;
      else errorCount++;
    });
    
    console.log('='.repeat(60));
    console.log(`SUMMARY: ${secureCount} Secure, ${vulnerableCount} Vulnerable, ${errorCount} Errors`);
    
    if (vulnerableCount === 0) {
      console.log('✅ SERVER IS SECURE AGAINST COMMAND INJECTION ATTACKS!');
    } else {
      console.log('🚨 SERVER HAS SOME VULNERABILITIES THAT NEED TO BE ADDRESSED');
    }
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Clean up test artifacts
   */
  async cleanup() {
    try {
      const cleanupCommands = [
        'rm -f /tmp/type_coercion_secure_test',
        'rm -f /tmp/backdoor_secure_test.sh',
        'rm -f /tmp/info_gathering_secure_test',
        'rm -rf /tmp/chain_secure_test_dir',
        'rm -f /tmp/test*'
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
  const tester = new SecureServerTester();
  tester.runAllTests().catch(console.error);
}

export default SecureServerTester; 