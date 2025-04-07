/**
 * Simple Vercel Deployment Helper
 */

import { execSync } from 'child_process';

async function main() {
  console.log('🚀 Deploying to Vercel...');

  // Deploy to Vercel with environment variables to skip problematic steps
  const deployCommand =
    'npx vercel deploy --prod ' +
    '--env NODE_ENV=production ' +
    '--env ASTRO_DB_ENABLED=true ' +
    '--env ASTRO_DB_MODE=production';

  try {
    console.log(`Running: ${deployCommand}`);
    execSync(deployCommand, { stdio: 'inherit' });

    console.log('\n✅ Deployment initiated!');
    console.log('\nIMPORTANT: Make sure you have set up:');
    console.log('1. Astro DB environment variables in the Vercel dashboard:');
    console.log('   - ASTRO_DB_ENABLED=true');
    console.log('   - ASTRO_DB_MODE=production');
    console.log('   - ASTRO_DB_URL (if using a remote database)');
  } catch (error) {
    console.error('Deployment failed:', error.message);
  }
}

main().catch(console.error);
