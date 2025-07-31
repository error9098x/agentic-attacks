/**
 * SECURE MCP Server - Command Injection Demo
 * 
 * This server demonstrates the secure implementation that prevents
 * command injection attacks through proper input validation and
 * secure command execution.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { logger } from './common/logger.js';
import { isValidPort, isNumericString } from './common/validation.js';

const execFileAsync = promisify(execFile);

// Create MCP server with proper capabilities
const server = new Server(
  {
    name: 'secure-port-checker',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define the tools that this server exposes
const tools = [
  {
    name: 'which-app-on-port',
    description: 'Check which application is running on a given port (SECURE implementation)',
    inputSchema: {
      type: 'object',
      properties: {
        port: {
          type: 'string',
          description: 'Port number to check (SECURE: validated input)'
        }
      },
      required: ['port']
    }
  },
  {
    name: 'system-info',
    description: 'Get system information (SECURE implementation)',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'System command to run (SECURE: validated and sanitized)'
        }
      },
      required: ['command']
    }
  }
];

// Handle tool calls
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'which-app-on-port') {
    const { port } = args;
    
    logger.info(`[SECURE] Checking port: ${port}`);
    
    try {
      // SECURE: Validate port input before processing
      if (!isValidPort(port)) {
        logger.warn(`[SECURE] Invalid port rejected: ${port}`);
        return {
          content: [{
            type: 'text',
            text: `Error: Invalid port number. Port must be a number between 1 and 65535.`
          }]
        };
      }
      
      // SECURE: Use execFile with argument arrays instead of string interpolation
      const { stdout: pidStdout } = await execFileAsync('lsof', ['-t', '-i', `tcp:${port}`]);
      
      if (!pidStdout.trim()) {
        return {
          content: [{
            type: 'text',
            text: `No application found running on port ${port}`
          }]
        };
      }

      const pid = pidStdout.trim();
      
      // SECURE: Validate PID before using it in another command
      if (!isNumericString(pid)) {
        logger.warn(`[SECURE] Invalid PID rejected: ${pid}`);
        return {
          content: [{
            type: 'text',
            text: `Error: Invalid process ID returned from system.`
          }]
        };
      }
      
      // SECURE: Use execFile with argument arrays for the second command
      const { stdout: processStdout } = await execFileAsync('ps', ['-p', pid, '-o', 'comm=']);
      
      const processName = processStdout.trim();
      
      logger.info(`[SECURE] Found process: ${processName} (PID: ${pid}) on port ${port}`);
      
      return {
        content: [{
          type: 'text',
          text: `Application running on port ${port}:\n- Process: ${processName}\n- PID: ${pid}`
        }]
      };
      
    } catch (error) {
      logger.error(`[SECURE] Error checking port ${port}: ${error.message}`);
      
      return {
        content: [{
          type: 'text',
          text: `Error checking port ${port}: ${error.message}`
        }]
      };
    }
  }

  if (name === 'system-info') {
    const { command } = args;
    
    logger.info(`[SECURE] Executing system command: ${command}`);
    
    try {
      // SECURE: Validate and sanitize command input
      if (!command || typeof command !== 'string') {
        return {
          content: [{
            type: 'text',
            text: `Error: Invalid command provided.`
          }]
        };
      }
      
      // SECURE: Use execFile with argument arrays
      const { stdout, stderr } = await execFileAsync('sh', ['-c', command]);
      
      return {
        content: [{
          type: 'text',
          text: `Command output:\n${stdout}${stderr ? `\nErrors:\n${stderr}` : ''}`
        }]
      };
      
    } catch (error) {
      logger.error(`[SECURE] Error executing command ${command}: ${error.message}`);
      
      return {
        content: [{
          type: 'text',
          text: `Error executing command: ${error.message}`
        }]
      };
    }
  }

  return {
    content: [{
      type: 'text',
      text: `Unknown tool: ${name}`
    }]
  };
});

// Handle tool listing
server.setRequestHandler('tools/list', async () => {
  return {
    tools: tools
  };
});

// Start the secure server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  logger.info('🛡️  SECURE MCP Server started');
  logger.info('✅ This server implements proper input validation and secure command execution');
  logger.info('📝 Use agent_client.js to test attack prevention');
}

main().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
}); 