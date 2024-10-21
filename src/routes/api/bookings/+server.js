// src/routes/api/bookings/+server.js

import { PrismaClient } from '@prisma/client';
import { error } from '@sveltejs/kit';

const prisma = new PrismaClient();

export async function GET({ locals }) {
  try {
    // Ensure the user is authenticated
    const user = locals.user;
    if (!user) {
      throw error(401, 'Unauthorized');
    }

    const userId = user.id;

    // Fetch bookings where the user is a participant or organizer
    const bookings = await prisma.booking.findMany({
      where: {
        OR: [
          { organizerId: userId },
          {
            participants: {
              some: { userId: userId },
            },
          },
        ],
      },
      include: {
        event: true,
        participants: {
          include: {
            user: true,
          },
        },
        organizer: {
          select: {
            id: true,
            username: true,
            email: true,
            calendar: true,
          },
        },
      },
    });

    return new Response(JSON.stringify(bookings), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error fetching bookings:', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch bookings.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
