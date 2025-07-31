/**
 * VULNERABLE MCP Server - Command Injection Demo
 * 
 * This server demonstrates a real-world command injection vulnerability
 * in a CI/CD bot scenario where port checking is automated.
 * 
 * VULNERABILITY: Direct string interpolation of user input into shell commands
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from './common/logger.js';

const execAsync = promisify(exec);

// Create MCP server
const server = new Server(
  {
    name: 'vulnerable-port-checker',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// VULNERABLE: which-app-on-port tool
// This tool is meant to check which application is running on a given port
// but is vulnerable to command injection attacks
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'which-app-on-port') {
    const { port } = args;
    
    logger.info(`[VULNERABLE] Checking port: ${port}`);
    
    try {
      // VULNERABLE: Direct string interpolation of user input into shell command!
      // This allows attackers to inject arbitrary commands
      const { stdout: pidStdout } = await execAsync(`lsof -t -i tcp:${port}`);
      
      if (!pidStdout.trim()) {
        return {
          content: [{
            type: 'text',
            text: `No application found running on port ${port}`
          }]
        };
      }

      const pid = pidStdout.trim();
      
      // VULNERABLE: Even more dangerous - PID from first command is used in second command
      // If the first command was manipulated, this becomes a chain exploit
      const { stdout: processStdout } = await execAsync(`ps -p ${pid} -o comm=`);
      
      const processName = processStdout.trim();
      
      logger.info(`[VULNERABLE] Found process: ${processName} (PID: ${pid}) on port ${port}`);
      
      return {
        content: [{
          type: 'text',
          text: `Application running on port ${port}:\n- Process: ${processName}\n- PID: ${pid}`
        }]
      };
      
    } catch (error) {
      logger.error(`[VULNERABLE] Error checking port ${port}: ${error.message}`);
      
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
    
    logger.info(`[VULNERABLE] Executing system command: ${command}`);
    
    try {
      // VULNERABLE: Direct execution of user input
      const { stdout, stderr } = await execAsync(command);
      
      return {
        content: [{
          type: 'text',
          text: `Command output:\n${stdout}${stderr ? `\nErrors:\n${stderr}` : ''}`
        }]
      };
      
    } catch (error) {
      logger.error(`[VULNERABLE] Error executing command ${command}: ${error.message}`);
      
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

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'which-app-on-port',
        description: 'Check which application is running on a given port (VULNERABLE to command injection)',
        inputSchema: {
          type: 'object',
          properties: {
            port: {
              type: 'string',
              description: 'Port number to check (VULNERABLE: accepts any string)'
            }
          },
          required: ['port']
        }
      },
      {
        name: 'system-info',
        description: 'Get system information (VULNERABLE to command injection)',
        inputSchema: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'System command to run (VULNERABLE: accepts any command)'
            }
          },
          required: ['command']
        }
      }
    ]
  };
});

// Start the vulnerable server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  logger.info('🚨 VULNERABLE MCP Server started');
  logger.info('⚠️  This server is intentionally vulnerable to command injection attacks');
  logger.info('📝 Use agent_client.js to test various attack payloads');
}

main().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});