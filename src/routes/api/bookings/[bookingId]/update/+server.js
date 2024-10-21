// src/routes/api/bookings/[bookingId]/update/+server.js

import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
// Import Google Calendar functions if needed
// import { updateGoogleCalendarEvent } from '$lib/googleCalendar';

const prisma = new PrismaClient();

// Define the schema for updating booking data using Zod
const bookingUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  duration: z.number().positive('Duration must be positive'),
  platform: z.string().min(1, 'Platform is required'),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid start time' }),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid end time' }),
  participantIds: z
    .array(z.number().positive('Participant ID must be positive'))
    .min(1, 'At least one participant is required'),
});

export async function PUT({ params, request, locals }) {
  const { bookingId } = params;

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
    console.log('Received booking update data:', data);

    const bookingData = bookingUpdateSchema.parse(data);

    // 3. Participant Verification
    // 3.1. Ensure organizer is not a participant
    if (bookingData.participantIds.includes(user.id)) {
      return new Response(JSON.stringify({ error: 'Organizer cannot be a participant.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3.2. Verify that all participant IDs exist
    const participants = await prisma.user.findMany({
      where: { id: { in: bookingData.participantIds } },
      select: { id: true, email: true, username: true }, // Select necessary fields for notifications
    });

    if (participants.length !== bookingData.participantIds.length) {
      return new Response(JSON.stringify({ error: 'One or more participant IDs are invalid.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Fetch existing booking
    const existingBooking = await prisma.booking.findUnique({
      where: { id: parseInt(bookingId, 10) },
      include: {
        participants: true,
        organizer: true,
        event: true,
      },
    });

    if (!existingBooking) {
      return new Response(JSON.stringify({ error: 'Booking not found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 5. Authorization: Only the organizer can update the booking
    if (existingBooking.organizerId !== user.id) {
      return new Response(JSON.stringify({ error: 'You are not authorized to update this booking.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 6. Update Event details
    const updatedEvent = await prisma.event.update({
      where: { id: existingBooking.eventId },
      data: {
        title: bookingData.title,
        description: bookingData.description,
        duration: bookingData.duration,
        platform: bookingData.platform,
        startTime: new Date(bookingData.startTime),
        endTime: new Date(bookingData.endTime),
      },
    });

    // 7. Update Booking Participants
    // 7.1. Remove all existing participants
    await prisma.bookingParticipant.deleteMany({
      where: { bookingId: existingBooking.id },
    });

    console.log(`Deleted existing participants for Booking ID ${existingBooking.id}`);

    // 7.2. Add new participants with response: "PENDING"
    // Ensure participantIds are unique
    const uniqueParticipantIds = Array.from(new Set(bookingData.participantIds));

    await prisma.bookingParticipant.createMany({
      data: uniqueParticipantIds.map((participantId) => ({
        bookingId: existingBooking.id,
        userId: participantId,
        response: 'PENDING', // Reset confirmation status
      })),
      // Remove 'skipDuplicates: true' as it's unsupported in SQLite
    });

    console.log(`Added new participants for Booking ID ${existingBooking.id}`);

    // 8. Fetch the updated booking
    const updatedBooking = await prisma.booking.findUnique({
      where: { id: existingBooking.id },
      include: {
        participants: { include: { user: true } },
        organizer: true,
        event: true,
      },
    });

    console.log('Booking updated successfully:', updatedBooking);

    // 9. Google Calendar Integration
    // If the booking is already confirmed, update the Google Calendar event
    if (updatedBooking.status === 'CONFIRMED') {
      // Uncomment and implement if needed
      // await updateGoogleCalendarEvent(updatedBooking);
      // await inviteParticipantsToGoogleEvent(updatedBooking);
    }

    // 10. Notifications
    // TODO: Notify new participants about the updated booking for confirmation

    // 11. Return Response
    return new Response(JSON.stringify({ booking: updatedBooking }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    // 12. Error Handling
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

    console.error('Booking Update Error:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
