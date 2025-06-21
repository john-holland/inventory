#!/usr/bin/env node

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

class GuidedTourRunner {
  constructor() {
    this.serverProcess = null;
    this.mobileProcess = null;
    this.playwrightProcess = null;
    this.baseUrl = 'http://localhost:3000';
  }

  async start() {
    console.log('🎬 Starting Cursor Guided Tour...\n');
    
    try {
      // Check if server is already running
      const isServerRunning = await this.checkServerHealth();
      
      if (!isServerRunning) {
        console.log('🚀 Starting the inventory server...');
        await this.startServer();
        await this.waitForServer();
      } else {
        console.log('✅ Server is already running');
      }

      // Start mobile app
      console.log('📱 Starting React Native mobile app...');
      await this.startMobileApp();

      // Run Playwright tests
      console.log('🎭 Running guided tour with Playwright...');
      await this.runPlaywrightTour();

      console.log('\n🎉 Tour completed! You can now:');
      console.log('   🌐 Web App: http://localhost:3000');
      console.log('   📱 Mobile App: Check your terminal for Expo QR code');
      console.log('   🎬 Re-run tour: npm run tour');
      
    } catch (error) {
      console.error('❌ Tour failed:', error.message);
      this.cleanup();
      process.exit(1);
    }
  }

  async checkServerHealth() {
    return new Promise((resolve) => {
      const req = http.get(`${this.baseUrl}/health`, (res) => {
        resolve(res.statusCode === 200);
      });
      
      req.on('error', () => {
        resolve(false);
      });
      
      req.setTimeout(2000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  async startServer() {
    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('npm', ['start'], {
        stdio: 'pipe',
        shell: true
      });

      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('running on port 3000')) {
          console.log('✅ Server started successfully');
          resolve();
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        console.error('Server error:', data.toString());
      });

      this.serverProcess.on('error', (error) => {
        reject(new Error(`Failed to start server: ${error.message}`));
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 30000);
    });
  }

  async waitForServer() {
    console.log('⏳ Waiting for server to be ready...');
    
    for (let i = 0; i < 30; i++) {
      const isReady = await this.checkServerHealth();
      if (isReady) {
        console.log('✅ Server is ready');
        return;
      }
      await this.sleep(1000);
    }
    
    throw new Error('Server failed to start within 30 seconds');
  }

  async startMobileApp() {
    return new Promise((resolve, reject) => {
      // Check if mobile app directory exists
      const mobileAppPath = path.join(__dirname, 'mobile-app');
      if (!fs.existsSync(mobileAppPath)) {
        console.log('⚠️  Mobile app not found, skipping...');
        resolve();
        return;
      }

      this.mobileProcess = spawn('npm', ['start'], {
        cwd: mobileAppPath,
        stdio: 'pipe',
        shell: true
      });

      this.mobileProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('📱 Mobile:', output.trim());
        
        if (output.includes('QR Code') || output.includes('Metro waiting')) {
          console.log('✅ Mobile app started');
          resolve();
        }
      });

      this.mobileProcess.stderr.on('data', (data) => {
        console.error('Mobile error:', data.toString());
      });

      this.mobileProcess.on('error', (error) => {
        console.log('⚠️  Mobile app failed to start, continuing without it...');
        resolve();
      });

      // Timeout after 15 seconds
      setTimeout(() => {
        console.log('⚠️  Mobile app startup timeout, continuing...');
        resolve();
      }, 15000);
    });
  }

  async runPlaywrightTour() {
    return new Promise((resolve, reject) => {
      console.log('🎭 Starting Playwright guided tour...');
      
      this.playwrightProcess = spawn('npx', ['playwright', 'test', 'tests/guided-tour.spec.js', '--headed'], {
        stdio: 'inherit',
        shell: true
      });

      this.playwrightProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Playwright tour completed successfully');
          resolve();
        } else {
          reject(new Error(`Playwright tour failed with code ${code}`));
        }
      });

      this.playwrightProcess.on('error', (error) => {
        reject(new Error(`Playwright failed: ${error.message}`));
      });
    });
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  cleanup() {
    console.log('\n🧹 Cleaning up...');
    
    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');
    }
    
    if (this.mobileProcess) {
      this.mobileProcess.kill('SIGTERM');
    }
    
    if (this.playwrightProcess) {
      this.playwrightProcess.kill('SIGTERM');
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down...');
  if (tourRunner) {
    tourRunner.cleanup();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  if (tourRunner) {
    tourRunner.cleanup();
  }
  process.exit(0);
});

// Run the tour
const tourRunner = new GuidedTourRunner();
tourRunner.start().catch((error) => {
  console.error('❌ Tour failed:', error.message);
  tourRunner.cleanup();
  process.exit(1);
}); 