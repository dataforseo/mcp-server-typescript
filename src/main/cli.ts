#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);
// Parse command line arguments
const mode = args[0] || 'local';
const configIndex = args.indexOf('--configuration');
const configPath = configIndex !== -1 && configIndex + 1 < args.length ? args[configIndex + 1] : null;
const debugLog = args.includes('--debug') || args.includes('-d');
// Set environment variable for configuration path if provided
if (configPath) {
    process.env.FIELD_CONFIG_PATH = configPath;
    console.error(`Using field configuration: ${configPath}`);
}
if( debugLog) {
    console.error('Debug mode enabled');
    process.env.DEBUG = 'true';
}
// Prepare arguments to pass to the spawned process (excluding --configuration args)
const argsWithoutMode = args.slice(1);
const childArgs = argsWithoutMode.filter((_, index) => {
    return index !== configIndex - 1 && index !== configIndex;});
    
if (mode === 'http') {
    const httpServer = join(__dirname, 'index-http.js');
    spawn('node', [httpServer, ...childArgs], { 
        stdio: 'inherit',
        env: { ...process.env }
    });
} else if (mode === 'sse') {
    const sseServer = join(__dirname, 'index-sse-http.js');
    spawn('node', [sseServer, ...childArgs], { 
        stdio: 'inherit',
        env: { ...process.env }
    });
} else {
    const localServer = join(__dirname, 'index.js');
    spawn('node', [localServer, ...childArgs], { 
        stdio: 'inherit',
        env: { ...process.env }
    });
}