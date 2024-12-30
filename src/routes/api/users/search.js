// src/routes/api/users/search.js

import prisma from '$lib/prisma';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  const query = url.searchParams.get('query');

  if (!query) {
    return new Response(JSON.stringify({ error: 'Query parameter is required.' }), { status: 400 });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: query,
          mode: 'insensitive',
        },
      },
      select: { id: true, username: true },
      take: 10, // Limit results to 10 (avoid unecessary headless server function calls)
    });

    return new Response(JSON.stringify(users), { status: 200 });
  } catch (err) {
    console.error('Error searching users:', err);
    return new Response(JSON.stringify({ error: 'Failed to search users.' }), { status: 500 });
  }
}
