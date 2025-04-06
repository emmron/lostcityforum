/**
 * Simple Vercel Deployment Helper
 */

import { execSync } from 'child_process';

async function main() {
  console.log('🚀 Deploying to Vercel...');

  // Deploy to Vercel with environment variables to skip problematic steps
  const deployCommand =
    'npx vercel deploy --prod ' +
    '--env PRISMA_GENERATE_SKIP_DUPLICATE=true ' +
    '--env NODE_ENV=production';

  try {
    console.log(`Running: ${deployCommand}`);
    execSync(deployCommand, { stdio: 'inherit' });

    console.log('\n✅ Deployment initiated!');
    console.log('\nIMPORTANT: Make sure you have set up:');
    console.log('1. DATABASE_URL environment variable in Vercel dashboard');
    console.log('2. Created a PostgreSQL database (Vercel, Neon, Supabase, etc.)');
  } catch (error) {
    console.error('Deployment failed:', error.message);
  }
}

main().catch(console.error);
