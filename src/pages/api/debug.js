import { db } from 'astro:db';

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

  // Get environment variables
  envVars = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
  };

  // Test database connection
  try {
    // Try a simple query to user table
    await db.select().from('User').limit(1);
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