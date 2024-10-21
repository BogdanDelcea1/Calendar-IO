// src/routes/calendar/+page.server.js

import { error } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function load({ locals }) {
  try {
    // 1. Authentication: Ensure the user is authenticated
    if (!locals.user) {
      console.warn('Unauthenticated access attempt to calendar.');
      throw error(401, 'Unauthorized');
    }

    const userId = locals.user.id;

    // 2. Fetch confirmed bookings where the user is a participant or organizer
    const bookings = await prisma.booking.findMany({
      where: {
        AND: [
          {
            OR: [
              { organizerId: userId },
              {
                participants: {
                  some: { userId: userId },
                },
              },
            ],
          },
          { status: 'CONFIRMED' }, // Only confirmed bookings
        ],
      },
      include: {
        event: true,
        participants: {
          include: { user: true },
        },
        organizer: {
          select: { id: true, username: true },
        },
      },
    });

    return {
      bookings,
      user: locals.user, // Include user data
    };
  } catch (err) {
    console.error('Error fetching calendar events:', err);
    throw error(500, 'Failed to fetch calendar events.');
  }
}
