// src/routes/api/users/+server.js

import { PrismaClient } from '@prisma/client';
import { error } from '@sveltejs/kit';

const prisma = new PrismaClient();

export async function GET({ locals }) {
  try {
    // Ensure the user is authenticated
    const user = locals.user;
    if (!user) {
      throw error(401, 'User not authenticated.');
    }

    // Fetch all users except the current user
    const users = await prisma.user.findMany({
      where: { NOT: { id: user.id } },
      select: { id: true, username: true, email: true },
    });

    return new Response(JSON.stringify({ users }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    throw error(500, 'Failed to fetch users.');
  }
}
