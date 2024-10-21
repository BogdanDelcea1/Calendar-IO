// src/routes/api/users/search/+server.js

import prisma from '$lib/prisma';
import { z } from 'zod';

const searchSchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty.'),
});

export async function GET({ url }) {
  const queryParam = url.searchParams.get('query');

  // Validate the query parameter
  const result = searchSchema.safeParse({ query: queryParam });

  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error.errors[0].message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { query } = result.data;

  try {
    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: query,
          // 'mode' is not supported in SQLite, so it's removed
        },
      },
      select: { id: true, username: true },
      take: 10,
    });

    return new Response(JSON.stringify(users), { status: 200 });
  } catch (err) {
    console.error('User Search Error:', err);
    return new Response(JSON.stringify({ error: 'Failed to search users.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
