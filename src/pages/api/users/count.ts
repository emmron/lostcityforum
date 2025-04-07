import { db, sql } from 'astro:db';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  // Count total users from Astro DB
  const result = await db.select({ count: sql`COUNT(*)` }).from('User');
  const userCount = result[0]?.count || 0;

  return new Response(JSON.stringify({ count: userCount }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};