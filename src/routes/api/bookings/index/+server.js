// src/routes/api/bookings/index/+server.js

import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Define the booking schema using Zod for validation
const bookingSchema = z.object({
  eventId: z.number(),
  organizerId: z.number(),
  participantId: z.number(),
  status: z.string(),
});

export async function POST({ request, locals }) {
  // Ensure the user is authenticated
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Parse and validate the incoming JSON data
    const data = await request.json();
    const { eventId, organizerId, participantId, status } = bookingSchema.parse(data);

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        eventId,
        organizerId,
        participantId,
        status,
      },
    });

    return new Response(JSON.stringify(booking), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    // Handle validation errors or other unexpected errors
    const errorMessage =
      err instanceof z.ZodError
        ? err.errors.map((e) => e.message).join(' ')
        : 'An unexpected error occurred.';
    console.error('Create Booking Error:', err);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

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
        event: true, // Include related event details
      },
    });

    return new Response(JSON.stringify(bookings), { status: 200 });
  } catch (err) {
    console.error('Fetch Bookings Error:', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch bookings.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
