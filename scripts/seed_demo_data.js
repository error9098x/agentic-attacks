#!/usr/bin/env node

/**
 * Demo Data Seeding Script
 * Prepares the environment for MCP injection demonstrations
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, mkdirSync } from 'fs';
import { logger } from '../server/common/logger.js';

const execAsync = promisify(exec);

class DemoDataSeeder {
  constructor() {
    this.demoData = {
      ports: [80, 443, 8080, 3000, 5432, 6379],
      processes: ['nginx', 'apache2', 'node', 'postgres', 'redis-server'],
      files: [],
      directories: []
    };
  }

  /**
   * Create demo directories
   */
  async createDemoDirectories() {
    logger.info('[SEED] Creating demo directories...');
    
    const directories = [
      'logs',
      'tmp/demo',
      'tmp/backup',
      'tmp/cache',
      'tmp/uploads'
    ];

    for (const dir of directories) {
      try {
        mkdirSync(dir, { recursive: true });
        this.demoData.directories.push(dir);
        logger.info(`[SEED] Created directory: ${dir}`);
      } catch (error) {
        logger.warn(`[SEED] Directory already exists: ${dir}`);
      }
    }
  }

  /**
   * Create demo files
   */
  async createDemoFiles() {
    logger.info('[SEED] Creating demo files...');
    
    const files = [
      {
        path: 'tmp/demo/config.json',
        content: JSON.stringify({
          server: 'demo-server',
          port: 8080,
          environment: 'demo',
          timestamp: new Date().toISOString()
        }, null, 2)
      },
      {
        path: 'tmp/demo/data.txt',
        content: 'This is demo data for testing purposes.\nContains multiple lines.\nFor demonstration only.'
      },
      {
        path: 'tmp/demo/backup.sql',
        content: '-- Demo database backup\n-- This is a mock backup file\n-- For demonstration purposes only\n\nSELECT * FROM users LIMIT 10;'
      },
      {
        path: 'tmp/cache/session.json',
        content: JSON.stringify({
          sessionId: 'demo-session-123',
          userId: 'demo-user',
          timestamp: new Date().toISOString(),
          data: { theme: 'dark', language: 'en' }
        }, null, 2)
      }
    ];

    for (const file of files) {
      try {
        writeFileSync(file.path, file.content);
        this.demoData.files.push(file.path);
        logger.info(`[SEED] Created file: ${file.path}`);
      } catch (error) {
        logger.error(`[SEED] Error creating file ${file.path}: ${error.message}`);
      }
    }
  }

  /**
   * Start demo services
   */
  async startDemoServices() {
    logger.info('[SEED] Starting demo services...');
    
    // Start a simple HTTP server for demo purposes
    try {
      const serverScript = `
        const http = require('http');
        const server = http.createServer((req, res) => {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('Demo server running on port 8080\\n');
        });
        server.listen(8080, () => {
          console.log('Demo server started on port 8080');
        });
      `;
      
      writeFileSync('tmp/demo-server.js', serverScript);
      
      // Start the server in the background
      const serverProcess = exec('node tmp/demo-server.js', (error, stdout, stderr) => {
        if (error) {
          logger.error(`[SEED] Demo server error: ${error.message}`);
        }
      });
      
      logger.info('[SEED] Demo server started on port 8080');
      
      // Wait a moment for server to start
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      logger.error(`[SEED] Error starting demo server: ${error.message}`);
    }
  }

  /**
   * Create demo environment variables
   */
  async createDemoEnvironment() {
    logger.info('[SEED] Creating demo environment...');
    
    const envContent = `
# Demo Environment Configuration
NODE_ENV=demo
DEMO_MODE=true
LOG_LEVEL=debug
PORT=3000

# Demo Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=demo_db
DB_USER=demo_user

# Demo API Keys (for demonstration only)
API_KEY=demo-api-key-12345
SECRET_KEY=demo-secret-key-67890

# Demo Services
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600

# Demo Monitoring
METRICS_ENABLED=true
ALERTING_ENABLED=true
    `.trim();

    try {
      writeFileSync('.env.demo', envContent);
      logger.info('[SEED] Created demo environment file: .env.demo');
    } catch (error) {
      logger.error(`[SEED] Error creating demo environment: ${error.message}`);
    }
  }

  /**
   * Create demo documentation
   */
  async createDemoDocumentation() {
    logger.info('[SEED] Creating demo documentation...');
    
    const readmeContent = `
# MCP Injection Demo - Demo Environment

This is a demo environment for testing MCP command injection vulnerabilities.

## Demo Files Created

### Directories
${this.demoData.directories.map(dir => `- \`${dir}\``).join('\n')}

### Files
${this.demoData.files.map(file => `- \`${file}\``).join('\n')}

## Demo Services

- **Demo Server**: Running on port 8080
- **Demo Database**: PostgreSQL on port 5432 (mock)
- **Demo Cache**: Redis on port 6379 (mock)

## Demo Data

The demo environment includes:
- Configuration files
- Sample data files
- Backup files
- Session data
- Cache files

## Security Notice

⚠️ **WARNING**: This is a demo environment with intentionally vulnerable code.
Do not use in production or on systems with sensitive data.

## Demo Commands

\`\`\`bash
# Start vulnerable server
npm run start:vulnerable

# Start secure server
npm run start:secure

# Run attack tests
npm run attack:type-coercion
npm run attack:chain
npm run attack:backdoor

# Run security tests
npm test
\`\`\`

## Demo Scenarios

1. **Type Coercion Attack**: Demonstrate command injection through type coercion
2. **Chain Exploitation**: Show chained command execution
3. **Backdoor Creation**: Demonstrate persistent access creation
4. **Information Gathering**: Show data exfiltration techniques

## Cleanup

Run \`npm run cleanup\` to remove all demo files and stop demo services.

---

**Created**: ${new Date().toISOString()}
**Environment**: Demo
**Purpose**: Security demonstration and testing
    `.trim();

    try {
      writeFileSync('DEMO_README.md', readmeContent);
      logger.info('[SEED] Created demo documentation: DEMO_README.md');
    } catch (error) {
      logger.error(`[SEED] Error creating demo documentation: ${error.message}`);
    }
  }

  /**
   * Verify demo environment
   */
  async verifyDemoEnvironment() {
    logger.info('[SEED] Verifying demo environment...');
    
    const checks = [
      { name: 'Demo directories', check: () => this.demoData.directories.every(dir => require('fs').existsSync(dir)) },
      { name: 'Demo files', check: () => this.demoData.files.every(file => require('fs').existsSync(file)) },
      { name: 'Demo server', check: async () => {
        try {
          const { stdout } = await execAsync('curl -s http://localhost:8080');
          return stdout.includes('Demo server running');
        } catch (error) {
          return false;
        }
      }},
      { name: 'Environment file', check: () => require('fs').existsSync('.env.demo') },
      { name: 'Documentation', check: () => require('fs').existsSync('DEMO_README.md') }
    ];

    let passedChecks = 0;
    
    for (const check of checks) {
      try {
        const result = await check.check();
        if (result) {
          logger.info(`[SEED] ✓ ${check.name}: OK`);
          passedChecks++;
        } else {
          logger.warn(`[SEED] ✗ ${check.name}: FAILED`);
        }
      } catch (error) {
        logger.error(`[SEED] ✗ ${check.name}: ERROR - ${error.message}`);
      }
    }

    logger.info(`[SEED] Environment verification: ${passedChecks}/${checks.length} checks passed`);
    
    if (passedChecks === checks.length) {
      logger.info('[SEED] Demo environment is ready!');
    } else {
      logger.warn('[SEED] Demo environment has some issues. Check the logs above.');
    }
  }

  /**
   * Run all seeding operations
   */
  async seed() {
    logger.info('[SEED] Starting demo data seeding...');
    
    try {
      await this.createDemoDirectories();
      await this.createDemoFiles();
      await this.startDemoServices();
      await this.createDemoEnvironment();
      await this.createDemoDocumentation();
      await this.verifyDemoEnvironment();
      
      logger.info('[SEED] Demo data seeding completed successfully!');
      
      console.log('\n' + '='.repeat(60));
      console.log('DEMO ENVIRONMENT READY');
      console.log('='.repeat(60));
      console.log('Demo directories created:', this.demoData.directories.length);
      console.log('Demo files created:', this.demoData.files.length);
      console.log('Demo server running on port 8080');
      console.log('Environment file: .env.demo');
      console.log('Documentation: DEMO_README.md');
      console.log('');
      console.log('Next steps:');
      console.log('1. Start vulnerable server: npm run start:vulnerable');
      console.log('2. Run attack tests: npm run attack:type-coercion');
      console.log('3. Start secure server: npm run start:secure');
      console.log('4. Run security tests: npm test');
      console.log('5. Cleanup when done: npm run cleanup');
      console.log('='.repeat(60) + '\n');
      
    } catch (error) {
      logger.error(`[SEED] Seeding failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const seeder = new DemoDataSeeder();
  seeder.seed().catch(console.error);
}

export default DemoDataSeeder; 