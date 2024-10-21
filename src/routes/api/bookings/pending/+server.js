// src/routes/api/bookings/pending/+server.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET({ locals }) {
  try {
    // 1. Authentication: Ensure the user is authenticated
    const user = locals.user;
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not authenticated.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Fetch Pending Bookings
    const pendingBookings = await prisma.booking.findMany({
      where: {
        status: 'PENDING',
        // Optionally, filter bookings where the user is either the organizer or a participant
        OR: [
          { organizerId: user.id },
          {
            participants: {
              some: {
                userId: user.id,
                response: 'PENDING',
              },
            },
          },
        ],
      },
      include: {
        event: true,
        organizer: { select: { id: true, username: true, email: true } },
        participants: {
          where: { response: 'PENDING' }, // Include only pending participants
          include: { user: { select: { id: true, username: true, email: true } } },
        },
      },
    });

    return new Response(JSON.stringify({ bookings: pendingBookings }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error fetching pending bookings:', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch pending bookings.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
