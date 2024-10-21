// src/routes/api/calendar/+server.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET({ locals }) {
  const userId = locals.user?.id;

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // Retrieve events where user is either creator or participant
  const bookings = await prisma.booking.findMany({
    where: {
      OR: [
        { organizerId: userId },
        { participantId: userId }
      ]
    },
    include: {
      event: true
    }
  });

  // Format the data as required for the calendar
  const events = bookings.map(booking => ({
    id: booking.event.id,
    title: booking.event.title,
    start: booking.event.startTime,
    end: booking.event.endTime,
    status: booking.status
  }));

  return new Response(JSON.stringify({ events }), { status: 200 });
}
