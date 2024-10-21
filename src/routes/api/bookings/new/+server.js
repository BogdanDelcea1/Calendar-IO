// src/routes/api/bookings/new/+server.js

import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Define the schema for booking data using Zod
const bookingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  duration: z.number().positive('Duration must be positive'),
  platform: z.string().min(1, 'Platform is required'),
  startTime: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid start time' }),
  endTime: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid end time' }),
  participantIds: z
    .array(z.number().positive('Participant ID must be positive'))
    .min(1, 'At least one participant is required'),
});

export async function POST({ request, locals }) {
  try {
    // 1. Authentication: Verify user is authenticated
    const user = locals.user;
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not authenticated.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Parse and validate incoming data
    const data = await request.json();
    console.log('Received booking data:', data);

    const bookingData = bookingSchema.parse(data);

    // 3. Participant Verification

    // 3.1. Ensure organizer is not a participant
    if (bookingData.participantIds.includes(user.id)) {
      return new Response(
        JSON.stringify({ error: 'Organizer cannot be a participant.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 3.2. Verify that all participant IDs exist
    const participants = await prisma.user.findMany({
      where: { id: { in: bookingData.participantIds } },
      select: { id: true, email: true, username: true }, // Select necessary fields for notifications
    });

    if (participants.length !== bookingData.participantIds.length) {
      return new Response(
        JSON.stringify({ error: 'One or more participant IDs are invalid.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 4. Event Creation
    const newEvent = await prisma.event.create({
      data: {
        title: bookingData.title,
        description: bookingData.description,
        duration: bookingData.duration,
        platform: bookingData.platform,
        startTime: new Date(bookingData.startTime),
        endTime: new Date(bookingData.endTime),
        creator: { connect: { id: user.id } }, // Connect the creator using the relation
      },
    });

    // 5. Booking Creation
    const newBooking = await prisma.booking.create({
      data: {
        eventId: newEvent.id,
        organizerId: user.id,
        status: 'PENDING', // Set to 'PENDING' initially
        // googleEventId is left null until confirmation
      },
      include: {
        participants: { include: { user: true } },
        organizer: true, // Include organizer for potential future use
        event: true, // Include event details
      },
    });

    console.log('Booking created successfully:', newBooking);

    // 6. Participant Assignment
    // Option 1: Check Before Creating to prevent duplicate entries

    // Initialize an array to hold successfully created participants
    const createdParticipants = [];

    for (const participantId of bookingData.participantIds) {
      // Check if the participant is already assigned to this booking
      const existingParticipant = await prisma.bookingParticipant.findUnique({
        where: {
          bookingId_userId: {
            bookingId: newBooking.id,
            userId: participantId,
          },
        },
      });

      if (!existingParticipant) {
        // If not, create a new BookingParticipant entry
        const bookingParticipant = await prisma.bookingParticipant.create({
          data: {
            bookingId: newBooking.id,
            userId: participantId,
            response: 'PENDING', // Participants start as unconfirmed
          },
        });
        createdParticipants.push(bookingParticipant);
        console.log(
          `Participant ID ${participantId} assigned to Booking ID ${newBooking.id}.`
        );
      } else {
        // If already exists, log a warning
        console.warn(
          `Participant ID ${participantId} is already assigned to Booking ID ${newBooking.id}.`
        );
      }
    }

    // 7. Fetch the updated booking with participants
    const updatedBooking = await prisma.booking.findUnique({
      where: { id: newBooking.id },
      include: {
        participants: { include: { user: true } },
        organizer: true,
        event: true,
      },
    });

    console.log('Participants assigned to booking:', updatedBooking.participants);

    // 8. Google Calendar Integration
    // **Do not** create the Google Calendar event here to prevent double bookings.
    // The event will be created upon participant confirmation.

    // 9. Notifications
    // TODO: Notify participants about the new booking for confirmation
    // Example:
    // await notifyParticipants(participants, updatedBooking);

    // 10. Return Response
    return new Response(JSON.stringify({ booking: updatedBooking }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    // 11. Error Handling
    if (err instanceof z.ZodError) {
      console.error('Validation Error:', err.errors);
      return new Response(
        JSON.stringify({ error: err.errors.map((e) => e.message).join(', ') }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle Prisma unique constraint errors manually
    if (err.code === 'P2002') {
      console.error('Unique Constraint Failed:', err.meta.target);
      return new Response(
        JSON.stringify({ error: 'Duplicate participant detected.' }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // General server error
    console.error('Booking Creation Error:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
