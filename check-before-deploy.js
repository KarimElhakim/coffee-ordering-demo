#!/usr/bin/env node

/**
 * Pre-Deployment Safety Checks
 * Run this before pushing to GitHub
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

console.log('\n🔍 Pre-Deployment Safety Checks');
console.log('================================\n');

let hasErrors = false;
let hasWarnings = false;

// Check 1: Verify .gitignore exists
console.log('1. Checking .gitignore...');
if (!existsSync('.gitignore')) {
  console.log('   ❌ .gitignore not found!');
  hasErrors = true;
} else {
  const gitignore = readFileSync('.gitignore', 'utf-8');
  const requiredEntries = ['.env', 'node_modules', 'CREDENTIALS'];
  const missing = requiredEntries.filter(entry => !gitignore.includes(entry));
  
  if (missing.length > 0) {
    console.log(`   ⚠️  Missing entries in .gitignore: ${missing.join(', ')}`);
    hasWarnings = true;
  } else {
    console.log('   ✅ .gitignore looks good');
  }
}

// Check 2: Verify no .env files are staged
console.log('\n2. Checking for sensitive files...');
try {
  const staged = execSync('git diff --cached --name-only', { encoding: 'utf-8' });
  const sensitiveFiles = staged.split('\n').filter(file => 
    file.includes('.env') || 
    file.includes('CREDENTIALS') ||
    file.includes('password') ||
    file.includes('secret')
  );
  
  if (sensitiveFiles.length > 0) {
    console.log('   ❌ Sensitive files are staged for commit:');
    sensitiveFiles.forEach(file => console.log(`      - ${file}`));
    hasErrors = true;
  } else {
    console.log('   ✅ No sensitive files staged');
  }
} catch (error) {
  console.log('   ℹ️  No files staged yet');
}

// Check 3: Verify MongoDB credentials are not in code
console.log('\n3. Checking for hardcoded credentials...');
try {
  const files = [
    'packages/api-server/src/db.ts',
    'packages/api-client/src/index.ts',
    'packages/api-client/src/mongo-client.ts'
  ];
  
  let foundCredentials = false;
  files.forEach(file => {
    if (existsSync(file)) {
      const content = readFileSync(file, 'utf-8');
      if (content.includes('mongodb+srv://') && content.includes('@')) {
        // Check if it's actually a hardcoded connection string, not just a comment
        const lines = content.split('\n');
        const suspiciousLines = lines.filter(line => 
          line.includes('mongodb+srv://') && 
          line.includes('@') &&
          !line.trim().startsWith('//') &&
          !line.trim().startsWith('*') &&
          line.includes('mongodb.net')
        );
        
        if (suspiciousLines.length > 0) {
          console.log(`   ⚠️  Found potential credentials in ${file}`);
          foundCredentials = true;
          hasWarnings = true;
        }
      }
    }
  });
  
  if (!foundCredentials) {
    console.log('   ✅ No hardcoded credentials found');
  }
} catch (error) {
  console.log('   ⚠️  Could not check all files');
  hasWarnings = true;
}

// Check 4: Verify environment variable usage
console.log('\n4. Checking environment variable usage...');
if (existsSync('packages/api-server/src/db.ts')) {
  const dbFile = readFileSync('packages/api-server/src/db.ts', 'utf-8');
  if (dbFile.includes('process.env.MONGODB_URI')) {
    console.log('   ✅ Using environment variables correctly');
  } else {
    console.log('   ⚠️  May not be using environment variables');
    hasWarnings = true;
  }
}

// Check 5: Verify .env.example exists
console.log('\n5. Checking for .env.example...');
if (existsSync('packages/api-server/.env.example')) {
  console.log('   ✅ .env.example exists');
} else {
  console.log('   ⚠️  .env.example not found (recommended for documentation)');
  hasWarnings = true;
}

// Check 6: Check for large files
console.log('\n6. Checking for large files...');
try {
  const files = execSync('git ls-files', { encoding: 'utf-8' }).split('\n');
  const largeFiles = files.filter(file => {
    if (!file || !existsSync(file)) return false;
    try {
      const stats = require('fs').statSync(file);
      return stats.size > 10 * 1024 * 1024; // 10MB
    } catch {
      return false;
    }
  });
  
  if (largeFiles.length > 0) {
    console.log('   ⚠️  Large files found (>10MB):');
    largeFiles.forEach(file => console.log(`      - ${file}`));
    hasWarnings = true;
  } else {
    console.log('   ✅ No large files found');
  }
} catch (error) {
  console.log('   ℹ️  Could not check file sizes');
}

// Check 7: Check for TODO/FIXME comments
console.log('\n7. Checking for TODO/FIXME comments...');
try {
  const todos = execSync('git grep -i "TODO\\|FIXME" || exit 0', { encoding: 'utf-8' });
  if (todos.trim()) {
    const count = todos.trim().split('\n').length;
    console.log(`   ℹ️  Found ${count} TODO/FIXME comments (not critical)`);
  } else {
    console.log('   ✅ No TODO/FIXME comments');
  }
} catch (error) {
  // Ignore errors
}

// Summary
console.log('\n================================');
console.log('Summary:');
console.log('================================\n');

if (hasErrors) {
  console.log('❌ ERRORS FOUND - Please fix before deploying!');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  WARNINGS FOUND - Review before deploying');
  console.log('\nIt\'s safe to deploy, but you may want to address the warnings.\n');
  process.exit(0);
} else {
  console.log('✅ ALL CHECKS PASSED!');
  console.log('\n🚀 Safe to deploy to GitHub!\n');
  process.exit(0);
}

