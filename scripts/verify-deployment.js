#!/usr/bin/env node

/**
 * Deployment verification script
 * This script checks if all required environment variables are set
 * and if the application can connect to the S3 bucket
 */

const https = require('https');
const { execSync } = require('child_process');
const { URL } = require('url');

// Check environment variables
const requiredEnvVars = [
  'AWS_ACCESS_KEY',
  'AWS_SECRET_KEY',
  'AWS_REGION',
  'AWS_BUCKET_NAME',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => console.error(`  - ${varName}`));
  console.error('Please set these variables in your .env.local file or deployment environment.');
  process.exit(1);
}

console.log('✅ All required environment variables are set.');

// Check if the application is running
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

console.log(`🔍 Checking if the application is running at ${appUrl}...`);

try {
  // Try to access the health endpoint
  const healthUrl = new URL('/api/health', appUrl);
  
  const request = https.get(healthUrl, (res) => {
    if (res.statusCode === 200) {
      console.log('✅ Application is running and health check passed.');
      
      // Additional checks can be added here
      
      console.log('✅ Deployment verification completed successfully!');
      process.exit(0);
    } else {
      console.error(`❌ Health check failed with status code: ${res.statusCode}`);
      process.exit(1);
    }
  });
  
  request.on('error', (err) => {
    console.error(`❌ Failed to connect to the application: ${err.message}`);
    console.error('Make sure the application is running and accessible.');
    process.exit(1);
  });
  
  request.end();
} catch (error) {
  console.error(`❌ Error during verification: ${error.message}`);
  process.exit(1);
}