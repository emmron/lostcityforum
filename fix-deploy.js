/**
 * Vercel Direct Deployment Helper
 *
 * This script helps deploy to Vercel with environment variables
 * to bypass Prisma generation issues.
 */

import { execSync } from 'child_process';

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

async function main() {
  console.log('🚀 Starting Vercel deployment with fixes...');

  // Prepare the project for PostgreSQL
  console.log('Preparing for PostgreSQL deployment...');
  runCommand('node deploy-to-vercel.js --prepare');

  // Add environment variables for deploy to avoid Prisma generate issues locally
  const deployCommand =
    'npx vercel deploy --prod ' +
    '--env PRISMA_SKIP_POSTINSTALL=true ' +
    '--env PRISMA_GENERATE_SKIP_DUPLICATE=true';

  console.log('Deploying to Vercel...');
  runCommand(deployCommand);

  console.log('\n✅ Deployment initiated!');
  console.log('\nIMPORTANT: After deployment, go to the Vercel dashboard and:');
  console.log('1. Add DATABASE_URL environment variable with your PostgreSQL connection');
  console.log('2. Trigger a new deployment');
}

main().catch(console.error);
