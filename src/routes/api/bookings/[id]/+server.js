// src/routes/api/bookings/[id]/+server.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT({ request, params, locals }) {
  try {
    const bookingId = parseInt(params.id);
    const data = await request.json();

    // Verify that the user is authenticated
    const user = locals.user;
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Fetch the booking to ensure the user is the organizer
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { organizer: true },
    });

    if (!booking || booking.organizerId !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    // Update the booking
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        event: {
          update: {
            title: data.title,
            description: data.description,
            duration: data.duration,
            platform: data.platform,
            startTime: new Date(data.startTime),
            endTime: new Date(data.endTime),
          },
        },
        status: 'PENDING',
        participants: {
          deleteMany: {}, // Remove existing participants
          create: data.participantIds.map((participantId) => ({
            user: { connect: { id: participantId } },
          })),
        },
      },
      include: {
        participants: true,
      },
    });

    // Reset participants' responses
    await prisma.bookingParticipant.updateMany({
      where: { bookingId },
      data: { response: 'PENDING' },
    });

    return new Response(JSON.stringify({ booking: updatedBooking }), { status: 200 });
  } catch (error) {
    console.error('Error updating booking:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

export async function DELETE({ params, locals }) {
  try {
    const bookingId = parseInt(params.id);

    // Verify that the user is authenticated
    const user = locals.user;
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Fetch the booking to ensure the user is the organizer
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { organizer: true },
    });

    if (!booking || booking.organizerId !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    // Delete the booking and related participants
    await prisma.booking.delete({
      where: { id: bookingId },
    });

    return new Response(JSON.stringify({ message: 'Booking deleted successfully' }), { status: 200 });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
