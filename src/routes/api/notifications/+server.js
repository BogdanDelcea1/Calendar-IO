// src/routes/api/notifications/+server.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET({ locals }) {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const userId = locals.user.id;

  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        isRead: false,
      },
    });

    return new Response(JSON.stringify(notifications), { status: 200 });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch notifications.' }), { status: 500 });
  }
}
