#!/usr/bin/env node

// Force Railway to use the correct server file
const fs = require('fs');
const { spawn } = require('child_process');

console.log('🔍 Railway Startup Script');
console.log('📁 Available files:');
console.log(fs.readdirSync('.').filter(f => f.endsWith('.js')));

// Remove any old debug files if they exist
const filesToRemove = ['server-railway-debug.js', 'server-debug.js'];
filesToRemove.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`🗑️ Removing old file: ${file}`);
    fs.unlinkSync(file);
  }
});

console.log('🚀 Starting server-secure.js');
const server = spawn('node', ['server-secure.js'], { stdio: 'inherit' });

server.on('error', (err) => {
  console.error('❌ Server failed to start:', err);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});