/**
 * Prisma PostgreSQL Migration Helper
 *
 * This script helps migrate from SQLite to PostgreSQL for Vercel deployment.
 *
 * INSTRUCTIONS:
 * 1. Make sure your schema.prisma provider is "postgresql"
 * 2. Set up a PostgreSQL database (local or remote)
 * 3. Update your .env file with the DATABASE_URL
 * 4. Run this script with: node prisma-deploy.js
 */

import { execSync } from 'child_process';

// Function to run commands and catch errors
function runCommand(command) {
  try {
    console.log(`Running: ${command}`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Main function to run migration
async function main() {
  console.log('🚀 Starting Prisma migration for PostgreSQL setup');

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    console.log('Please set up your .env file with a valid PostgreSQL connection string');
    process.exit(1);
  }

  console.log('Generating Prisma client...');
  if (!runCommand('npx prisma generate')) {
    process.exit(1);
  }

  // We're using a try/catch approach for migrations
  console.log('Creating migrations...');
  try {
    // Create a new migration
    if (!runCommand('npx prisma migrate dev --name init_postgresql --create-only')) {
      throw new Error('Failed to create migration');
    }

    // Apply the migration
    if (!runCommand('npx prisma migrate deploy')) {
      throw new Error('Failed to deploy migration');
    }

    // Seed the database
    if (!runCommand('npm run prisma:seed')) {
      throw new Error('Failed to seed database');
    }

    console.log('✅ PostgreSQL database successfully set up!');
    console.log('You can now deploy to Vercel with:');
    console.log('  npx vercel --prod');
    console.log('');
    console.log('Don\'t forget to set DATABASE_URL in your Vercel environment variables!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('');
    console.log('For Vercel deployment:');
    console.log('1. Create a PostgreSQL database (Vercel, Supabase, Railway, etc.)');
    console.log('2. Set DATABASE_URL in your Vercel project settings');
    console.log('3. Deploy your project');
    console.log('4. Run migrations on the first deploy with:');
    console.log('   npx vercel env pull .env.production');
    console.log('   DATABASE_URL="your-postgres-url" npx prisma migrate deploy');
    process.exit(1);
  }
}

main().catch(console.error);
