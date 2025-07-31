/**
 * Shell Command Execution Utilities for MCP Injection Demo
 * Provides both vulnerable and secure command execution methods
 */

import { exec, execFile } from 'child_process';
import { promisify } from 'util';
import { logger } from './logger.js';
import { createSafeCommand, validateCommandArgs } from './validation.js';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

/**
 * VULNERABLE: Direct command execution with string interpolation
 * This is intentionally vulnerable to command injection
 */
export async function executeVulnerable(command) {
  logger.warn(`[VULNERABLE] Executing command: ${command}`);
  
  try {
    const { stdout, stderr } = await execAsync(command);
    logger.info(`[VULNERABLE] Command executed successfully`);
    return { stdout, stderr, success: true };
  } catch (error) {
    logger.error(`[VULNERABLE] Command execution failed: ${error.message}`);
    return { stdout: '', stderr: error.message, success: false };
  }
}

/**
 * SECURE: Safe command execution using execFile with argument arrays
 * This prevents command injection by separating arguments
 */
export async function executeSecure(command, args = []) {
  try {
    // Validate command and arguments
    const safeCommand = createSafeCommand(command, args);
    logger.info(`[SECURE] Executing command: ${safeCommand.toString()}`);
    
    const { stdout, stderr } = await execFileAsync(command, args);
    logger.info(`[SECURE] Command executed successfully`);
    return { stdout, stderr, success: true };
  } catch (error) {
    logger.error(`[SECURE] Command execution failed: ${error.message}`);
    return { stdout: '', stderr: error.message, success: false };
  }
}

/**
 * VULNERABLE: Port checking with string interpolation
 * This demonstrates the vulnerable pattern from the demo
 */
export async function checkPortVulnerable(port) {
  logger.warn(`[VULNERABLE] Checking port: ${port}`);
  
  try {
    // VULNERABLE: Direct string interpolation
    const { stdout: pidStdout } = await execAsync(`lsof -t -i tcp:${port}`);
    
    if (!pidStdout.trim()) {
      return { success: false, message: `No application found on port ${port}` };
    }

    const pid = pidStdout.trim();
    
    // VULNERABLE: Chain exploit - PID from first command used in second
    const { stdout: processStdout } = await execAsync(`ps -p ${pid} -o comm=`);
    
    return {
      success: true,
      pid: pid,
      process: processStdout.trim()
    };
  } catch (error) {
    logger.error(`[VULNERABLE] Port check failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * SECURE: Port checking with proper validation and safe execution
 * This demonstrates the secure pattern from the demo
 */
export async function checkPortSecure(port) {
  logger.info(`[SECURE] Checking port: ${port}`);
  
  try {
    // SECURE: Use execFile with argument arrays
    const { stdout: pidStdout } = await execFileAsync('lsof', ['-t', '-i', `tcp:${port}`]);
    
    if (!pidStdout.trim()) {
      return { success: false, message: `No application found on port ${port}` };
    }

    const pid = pidStdout.trim();
    
    // SECURE: Validate PID before using in another command
    if (!/^\d+$/.test(pid)) {
      logger.warn(`[SECURE] Invalid PID returned: ${pid}`);
      return { success: false, error: 'Invalid process ID returned' };
    }
    
    // SECURE: Use execFile with argument arrays
    const { stdout: processStdout } = await execFileAsync('ps', ['-p', pid, '-o', 'comm=']);
    
    return {
      success: true,
      pid: pid,
      process: processStdout.trim()
    };
  } catch (error) {
    logger.error(`[SECURE] Port check failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Demo function to show the difference between vulnerable and secure execution
 */
export async function demonstrateExecutionDifference(command, args = []) {
  console.log('\n=== EXECUTION COMPARISON ===');
  
  // Vulnerable execution
  console.log('\n🚨 VULNERABLE EXECUTION:');
  const vulnerableResult = await executeVulnerable(`${command} ${args.join(' ')}`);
  console.log('Result:', vulnerableResult);
  
  // Secure execution
  console.log('\n🛡️  SECURE EXECUTION:');
  const secureResult = await executeSecure(command, args);
  console.log('Result:', secureResult);
  
  console.log('\n=== END COMPARISON ===\n');
  
  return { vulnerable: vulnerableResult, secure: secureResult };
}

// Export for use in other modules
export default {
  executeVulnerable,
  executeSecure,
  checkPortVulnerable,
  checkPortSecure,
  demonstrateExecutionDifference
}; 