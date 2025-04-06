import { prisma } from '../../lib/db.js';

export async function GET({ request, url }) {
  // Security check
  const key = url.searchParams.get('key');
  if (key !== 'debugkey2025') {
    return new Response(JSON.stringify({
      error: 'Unauthorized'
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  let dbStatus = 'Not checked';
  let dbError = null;
  let envVars = {};

  // Get environment variables (only show partial DATABASE_URL for security)
  const dbUrl = process.env.DATABASE_URL || 'Not set';
  envVars = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: dbUrl ? `${dbUrl.substring(0, 10)}...` : 'Not set',
    VERCEL_ENV: process.env.VERCEL_ENV,
  };

  // Test database connection
  try {
    // Try a simple query
    await prisma.$queryRaw`SELECT 1 as result`;
    dbStatus = 'Connected';
  } catch (error) {
    dbStatus = 'Error';
    dbError = error.message;
  }

  const responseData = {
    envVars,
    dbStatus,
    dbError
  };

  return new Response(JSON.stringify(responseData, null, 2), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}