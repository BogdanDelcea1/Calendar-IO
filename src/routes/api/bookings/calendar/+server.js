// src/routes/api/bookings/calendar/+server.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET({ locals }) {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const userId = locals.user.id;

  try {
    const bookings = await prisma.booking.findMany({
      where: {
        OR: [
          { organizerId: userId },
          { participantId: userId },
        ],
      },
      include: {
        event: true,
      },
    });

    // Transform bookings for frontend (e.g., formatting dates)
    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      title: booking.event.title,
      platform: booking.event.platform,
      startTime: booking.event.startTime,
      endTime: booking.event.endTime,
      status: booking.status,
      organizer: booking.organizerId,
      participant: booking.participantId,
    }));

    return new Response(JSON.stringify(formattedBookings), { status: 200 });
  } catch (err) {
    console.error('Error fetching calendar bookings:', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch calendar bookings.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
