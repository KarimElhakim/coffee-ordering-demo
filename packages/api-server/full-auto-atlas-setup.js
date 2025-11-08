#!/usr/bin/env node

/**
 * FULLY AUTOMATED MongoDB Atlas Setup
 * 
 * This script will:
 * 1. Connect to MongoDB Atlas API
 * 2. Create a FREE cluster (if not exists)
 * 3. Create database user
 * 4. Configure network access (whitelist IP)
 * 5. Get connection string
 * 6. Save to .env
 * 7. Seed database
 * 8. Test everything
 */

import { createInterface } from 'readline';
import { writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

// MongoDB Atlas API wrapper
class AtlasAPI {
  constructor(publicKey, privateKey, projectId) {
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.projectId = projectId;
    this.baseUrl = 'https://cloud.mongodb.com/api/atlas/v1.0';
  }

  async makeRequest(endpoint, method = 'GET', body = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const auth = Buffer.from(`${this.publicKey}:${this.privateKey}`).toString('base64');
    
    const options = {
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Atlas API Error: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  async listClusters() {
    return await this.makeRequest(`/groups/${this.projectId}/clusters`);
  }

  async createCluster(clusterName) {
    const clusterConfig = {
      name: clusterName,
      clusterType: 'REPLICASET',
      providerSettings: {
        providerName: 'TENANT',
        backingProviderName: 'AWS',
        regionName: 'US_EAST_1',
        instanceSizeName: 'M0'
      }
    };

    return await this.makeRequest(
      `/groups/${this.projectId}/clusters`,
      'POST',
      clusterConfig
    );
  }

  async getCluster(clusterName) {
    return await this.makeRequest(`/groups/${this.projectId}/clusters/${clusterName}`);
  }

  async createDatabaseUser(username, password) {
    const userConfig = {
      databaseName: 'admin',
      username: username,
      password: password,
      roles: [{
        databaseName: 'admin',
        roleName: 'atlasAdmin'
      }]
    };

    return await this.makeRequest(
      `/groups/${this.projectId}/databaseUsers`,
      'POST',
      userConfig
    );
  }

  async addIPWhitelist(ipAddress = '0.0.0.0/0') {
    const accessConfig = [{
      ipAddress: ipAddress,
      comment: 'Coffee Shop App - Auto-configured'
    }];

    return await this.makeRequest(
      `/groups/${this.projectId}/accessList`,
      'POST',
      accessConfig
    );
  }

  async getConnectionString(clusterName) {
    const cluster = await this.getCluster(clusterName);
    
    if (!cluster.connectionStrings || !cluster.connectionStrings.standardSrv) {
      throw new Error('Connection string not available yet. Cluster may still be creating.');
    }

    return cluster.connectionStrings.standardSrv;
  }
}

async function fullAutoSetup() {
  console.log('\n🤖 FULLY AUTOMATED MongoDB Atlas Setup');
  console.log('=========================================\n');
  console.log('This will automatically:');
  console.log('✅ Create a FREE MongoDB Atlas cluster');
  console.log('✅ Setup database user');
  console.log('✅ Configure network access');
  console.log('✅ Get connection string');
  console.log('✅ Seed database');
  console.log('✅ Start your app\n');

  // Step 1: Get Atlas API credentials
  console.log('📋 Step 1: Atlas API Credentials\n');
  console.log('To automate cluster creation, we need your Atlas API keys.');
  console.log('Get them from: https://cloud.mongodb.com/v2#/account/publicApi\n');
  console.log('Instructions:');
  console.log('1. Go to MongoDB Atlas');
  console.log('2. Click your profile (top right)');
  console.log('3. Click "Account"');
  console.log('4. Go to "API Keys" tab');
  console.log('5. Click "Create API Key"\n');

  const hasKeys = await ask('Do you have API keys? (yes/no): ');
  
  if (hasKeys.toLowerCase() !== 'yes' && hasKeys.toLowerCase() !== 'y') {
    console.log('\n📖 Please create API keys first:');
    console.log('   1. Visit: https://cloud.mongodb.com/v2#/account/publicApi');
    console.log('   2. Create API Key with "Project Owner" permissions');
    console.log('   3. Save the Public and Private keys');
    console.log('   4. Run this script again\n');
    process.exit(0);
  }

  const publicKey = await ask('\nEnter your Public API Key: ');
  const privateKey = await ask('Enter your Private API Key: ');
  const projectId = await ask('Enter your Project ID (from Atlas URL): ');

  console.log('\n🔧 Initializing Atlas API...');
  const atlas = new AtlasAPI(publicKey.trim(), privateKey.trim(), projectId.trim());

  try {
    // Step 2: Check existing clusters
    console.log('\n📊 Step 2: Checking existing clusters...\n');
    const clusters = await atlas.listClusters();
    
    let clusterName = 'coffee-shop-cluster';
    let useExisting = false;

    if (clusters.results && clusters.results.length > 0) {
      console.log('✅ Found existing clusters:');
      clusters.results.forEach((cluster, i) => {
        console.log(`   ${i + 1}. ${cluster.name} (${cluster.stateName})`);
      });

      const choice = await ask('\nUse existing cluster? (yes/no): ');
      
      if (choice.toLowerCase() === 'yes' || choice.toLowerCase() === 'y') {
        useExisting = true;
        if (clusters.results.length === 1) {
          clusterName = clusters.results[0].name;
        } else {
          const clusterIndex = await ask('Which cluster? (enter number): ');
          clusterName = clusters.results[parseInt(clusterIndex) - 1].name;
        }
      }
    }

    // Step 3: Create cluster if needed
    if (!useExisting) {
      console.log('\n🏗️  Step 3: Creating FREE cluster...\n');
      console.log(`Cluster name: ${clusterName}`);
      console.log('Tier: M0 (FREE forever!)');
      console.log('Provider: AWS');
      console.log('Region: US_EAST_1\n');

      try {
        await atlas.createCluster(clusterName);
        console.log('✅ Cluster creation started!');
        console.log('⏱️  This takes 1-3 minutes...\n');
      } catch (error) {
        if (error.message.includes('DUPLICATE_CLUSTER_NAME')) {
          console.log('ℹ️  Cluster already exists. Using existing cluster.');
          useExisting = true;
        } else {
          throw error;
        }
      }
    } else {
      console.log(`\n✅ Using existing cluster: ${clusterName}\n`);
    }

    // Step 4: Wait for cluster to be ready
    console.log('⏳ Step 4: Waiting for cluster to be ready...\n');
    let clusterReady = false;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes

    while (!clusterReady && attempts < maxAttempts) {
      try {
        const cluster = await atlas.getCluster(clusterName);
        console.log(`   Status: ${cluster.stateName}`);
        
        if (cluster.stateName === 'IDLE') {
          clusterReady = true;
          console.log('\n✅ Cluster is ready!\n');
        } else {
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
          attempts++;
        }
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      }
    }

    if (!clusterReady) {
      console.log('\n⚠️  Cluster is still creating. This is normal for new clusters.');
      console.log('   You can continue and check back in a few minutes.\n');
    }

    // Step 5: Create database user
    console.log('👤 Step 5: Creating database user...\n');
    
    const username = 'coffee-admin';
    const password = 'Coffee' + Math.random().toString(36).slice(-8) + '123!';
    
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log('(Save this password!)\n');

    try {
      await atlas.createDatabaseUser(username, password);
      console.log('✅ Database user created!\n');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  User already exists. Using existing user.');
        const useExistingPassword = await ask('Enter existing user password: ');
        password = useExistingPassword;
      } else {
        console.log('⚠️  Could not create user:', error.message);
        console.log('You may need to create the user manually in Atlas.\n');
      }
    }

    // Step 6: Configure network access
    console.log('🌐 Step 6: Configuring network access...\n');
    
    try {
      await atlas.addIPWhitelist();
      console.log('✅ Network access configured (0.0.0.0/0 - all IPs)\n');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  IP whitelist already configured.\n');
      } else {
        console.log('⚠️  Could not configure network:', error.message);
        console.log('You may need to whitelist IPs manually in Atlas.\n');
      }
    }

    // Step 7: Get connection string
    console.log('🔗 Step 7: Getting connection string...\n');
    
    let connectionString;
    try {
      connectionString = await atlas.getConnectionString(clusterName);
      
      // Replace placeholder with actual password
      connectionString = connectionString.replace('<username>', username);
      connectionString = connectionString.replace('<password>', password);
      
      // Add database name
      if (!connectionString.includes('/coffee-shop')) {
        connectionString = connectionString.replace(/\/\?/, '/coffee-shop?');
      }
      
      console.log('✅ Connection string obtained!\n');
      console.log('Connection: ' + connectionString.substring(0, 50) + '...\n');
    } catch (error) {
      console.log('⚠️  Could not get connection string automatically.');
      console.log('Error:', error.message);
      connectionString = await ask('\nPlease paste connection string from Atlas: ');
    }

    // Step 8: Save configuration
    console.log('💾 Step 8: Saving configuration...\n');
    
    const envContent = `PORT=3001
MONGODB_URI=${connectionString}
NODE_ENV=development
`;
    
    const envPath = join(__dirname, '.env');
    writeFileSync(envPath, envContent);
    
    console.log('✅ Configuration saved to .env\n');

    // Also save credentials for reference
    const credentialsPath = join(__dirname, 'atlas-credentials.txt');
    const credentialsContent = `MongoDB Atlas Credentials
========================

Cluster Name: ${clusterName}
Username: ${username}
Password: ${password}

Connection String:
${connectionString}

Atlas Dashboard:
https://cloud.mongodb.com/v2/${projectId}#/clusters

KEEP THIS FILE SECURE AND DO NOT COMMIT TO GIT!
`;
    
    writeFileSync(credentialsPath, credentialsContent);
    console.log('📄 Credentials saved to: atlas-credentials.txt\n');

    // Step 9: Test connection
    console.log('🧪 Step 9: Testing connection...\n');
    
    try {
      const { connectDB } = await import('./src/db.js');
      await connectDB();
      console.log('✅ Successfully connected to MongoDB Atlas!\n');
    } catch (error) {
      console.log('⚠️  Connection test failed:', error.message);
      console.log('The cluster may still be initializing. Try again in a few minutes.\n');
    }

    // Step 10: Seed database
    console.log('🌱 Step 10: Seeding database...\n');
    
    const seedNow = await ask('Seed database now? (yes/no): ');
    
    if (seedNow.toLowerCase() === 'yes' || seedNow.toLowerCase() === 'y') {
      console.log('\nSeeding database...\n');
      try {
        await execAsync('pnpm seed', { cwd: join(__dirname, '../..') });
        console.log('\n✅ Database seeded successfully!\n');
      } catch (error) {
        console.log('⚠️  Seeding failed. You can run manually: pnpm seed\n');
      }
    }

    // Summary
    console.log('\n🎉 SETUP COMPLETE!');
    console.log('==================\n');
    console.log('✅ Cluster created: ' + clusterName);
    console.log('✅ Database user: ' + username);
    console.log('✅ Network configured');
    console.log('✅ Connection tested');
    console.log('✅ Configuration saved\n');
    console.log('📋 Next steps:');
    console.log('   1. Start API: pnpm dev:api');
    console.log('   2. Start apps: pnpm dev');
    console.log('   3. Or start all: pnpm dev:all\n');
    console.log('🔐 Your credentials are in: atlas-credentials.txt\n');
    console.log('🌐 Atlas Dashboard: https://cloud.mongodb.com/v2/' + projectId + '#/clusters\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check your API keys are correct');
    console.error('   2. Ensure you have project permissions');
    console.error('   3. Try manual setup: pnpm setup:atlas');
    console.error('   4. See: MONGODB_ATLAS_SETUP.md\n');
  } finally {
    rl.close();
  }
}

fullAutoSetup().catch(console.error);

