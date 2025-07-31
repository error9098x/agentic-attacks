/**
 * Input Validation Utilities for MCP Injection Demo
 * Provides secure validation functions to prevent command injection
 */

import { z } from 'zod';

// Port validation schema
const PortSchema = z.number().int().min(1).max(65535);

// PID validation schema
const PidSchema = z.string().regex(/^\d+$/);

/**
 * Validates if a port number is valid (1-65535)
 * @param {any} port - The port to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export function isValidPort(port) {
  try {
    PortSchema.parse(port);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validates if a string contains only numeric characters
 * @param {string} str - The string to validate
 * @returns {boolean} - True if numeric only, false otherwise
 */
export function isNumericString(str) {
  try {
    PidSchema.parse(str);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validates if a string contains dangerous shell characters
 * @param {string} str - The string to validate
 * @returns {boolean} - True if dangerous, false otherwise
 */
export function containsDangerousChars(str) {
  const dangerousPatterns = [
    /[;&|`$(){}[\]]/,  // Shell metacharacters
    /\.\./,            // Directory traversal
    /\/etc\/passwd/,   // Sensitive files
    /\/proc\//,        // Process information
    /\/sys\//,         // System information
    /\/dev\//,         // Device files
    /\/tmp\/.*\.sh/,   // Shell scripts in /tmp
    /curl\s+http/,     // Outbound connections
    /wget\s+http/,     // Outbound connections
    /nc\s+/,           // Netcat
    /bash\s+-i/,       // Interactive shell
    /python\s+-c/,     // Python code execution
    /node\s+-e/,       // Node.js code execution
  ];

  return dangerousPatterns.some(pattern => pattern.test(str));
}

/**
 * Sanitizes a string by removing dangerous characters
 * @param {string} str - The string to sanitize
 * @returns {string} - The sanitized string
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') {
    return '';
  }
  
  // Remove shell metacharacters
  return str.replace(/[;&|`$(){}[\]]/g, '');
}

/**
 * Validates command arguments array
 * @param {Array} args - Array of command arguments
 * @returns {boolean} - True if valid, false otherwise
 */
export function validateCommandArgs(args) {
  if (!Array.isArray(args)) {
    return false;
  }
  
  return args.every(arg => {
    if (typeof arg !== 'string') {
      return false;
    }
    
    return !containsDangerousChars(arg);
  });
}

/**
 * Creates a safe command execution wrapper
 * @param {string} command - The command to execute
 * @param {Array} args - Array of arguments
 * @returns {Object} - Safe command execution object
 */
export function createSafeCommand(command, args = []) {
  // Validate command name
  if (typeof command !== 'string' || command.length === 0) {
    throw new Error('Invalid command name');
  }
  
  // Validate arguments
  if (!validateCommandArgs(args)) {
    throw new Error('Invalid command arguments');
  }
  
  return {
    command,
    args,
    toString() {
      return `${command} ${args.join(' ')}`;
    }
  };
}

// Export validation schemas for use in other modules
export { PortSchema, PidSchema }; 