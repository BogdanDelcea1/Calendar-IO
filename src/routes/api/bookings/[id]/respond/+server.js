// src/routes/api/bookings/[id]/respond/+server.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST({ request, params, locals }) {
  try {
    const bookingId = parseInt(params.id);
    const { response } = await request.json(); // 'ACCEPTED' or 'DECLINED'

    // Verify that the user is authenticated
    const user = locals.user;
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Update participant's response
    const updatedParticipant = await prisma.bookingParticipant.updateMany({
      where: {
        bookingId,
        userId: user.id,
      },
      data: {
        response,
      },
    });

    if (updatedParticipant.count === 0) {
      return new Response(JSON.stringify({ error: 'No matching booking participant found.' }), { status: 404 });
    }

    // Check if all participants have responded
    const participants = await prisma.bookingParticipant.findMany({
      where: { bookingId },
    });

    const allResponded = participants.every((p) => p.response !== 'PENDING');

    if (allResponded) {
      const allAccepted = participants.every((p) => p.response === 'ACCEPTED');
      const newStatus = allAccepted ? 'CONFIRMED' : 'DECLINED';

      // Update booking status
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: newStatus,
        },
      });
    }

    return new Response(JSON.stringify({ message: 'Response recorded' }), { status: 200 });
  } catch (error) {
    console.error('Error responding to booking:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
