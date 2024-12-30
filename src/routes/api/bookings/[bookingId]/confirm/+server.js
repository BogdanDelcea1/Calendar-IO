// src/routes/api/bookings/[bookingId]/confirm/+server.js

import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import {
  createGoogleCalendarEvent,
  inviteParticipantsToGoogleEvent,
} from '$lib/googleCalendar'; 

const prisma = new PrismaClient();

// Define the schema for confirmation data using Zod
const confirmationSchema = z.object({
  response: z.enum(['CONFIRMED', 'DECLINED']),
});

export async function POST({ params, request, locals }) {
  const { bookingId } = params;

  console.log(`\n--- Booking Confirmation Request Start ---`);
  console.log(`Received confirmation request for Booking ID: ${bookingId}`);

  try {
    // 1. Authentication: Verify user is authenticated
    const user = locals.user;
    if (!user) {
      console.warn('User not authenticated.');
      return new Response(JSON.stringify({ error: 'User not authenticated.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`Authenticated User ID: ${user.id}`);

    // 2. Parse and validate incoming data
    let data;
    try {
      data = await request.json();
      console.log('Received data:', data);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      return new Response(JSON.stringify({ error: 'Invalid JSON format.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let confirmationData;
    try {
      confirmationData = confirmationSchema.parse(data);
      console.log('Parsed confirmation data:', confirmationData);
    } catch (validationError) {
      console.error('Validation Error:', validationError.errors);
      return new Response(
        JSON.stringify({ error: validationError.errors.map((e) => e.message).join(', ') }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { response } = confirmationData;

    // 3. Fetch existing booking
    let booking;
    try {
      booking = await prisma.booking.findUnique({
        where: { id: parseInt(bookingId, 10) },
        include: {
          participants: { include: { user: true } },
          organizer: { include: { calendar: true } },
          event: true,
        },
      });

      if (!booking) {
        console.warn(`Booking not found: ID ${bookingId}`);
        return new Response(JSON.stringify({ error: 'Booking not found.' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      console.log(`Fetched Booking:`, booking);
    } catch (fetchError) {
      console.error('Error fetching booking:', fetchError);
      return new Response(JSON.stringify({ error: 'Error fetching booking details.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Check if the user is a participant or the organizer
    const participant = booking.participants.find((p) => p.userId === user.id);
    const isOrganizer = booking.organizer.id === user.id;

    if (!participant && !isOrganizer) {
      console.warn(`User ID ${user.id} is not a participant or organizer of Booking ID ${bookingId}`);
      return new Response(JSON.stringify({ error: 'You are not authorized to confirm this booking.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (participant) {
      console.log(`Participant found: User ID ${user.id}, Current Response: ${participant.response}`);
    } else {
      console.log(`User ID ${user.id} is the organizer of Booking ID ${bookingId}`);
    }

    // 5. Update participant's response if user is a participant
    if (participant) {
      try {
        const updatedParticipant = await prisma.bookingParticipant.update({
          where: {
            bookingId_userId: {
              bookingId: booking.id,
              userId: user.id,
            },
          },
          data: {
            response: response,
          },
        });

        console.log(`Updated Participant Response:`, updatedParticipant);
      } catch (updateError) {
        console.error('Error updating participant response:', updateError);
        return new Response(JSON.stringify({ error: 'Error updating your response.' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // 6. Fetch updated booking to check participants' responses
    let updatedBooking;
    try {
      updatedBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
        include: {
          participants: { include: { user: true } },
          organizer: { include: { calendar: true } },
          event: true,
        },
      });

      console.log(`Updated Booking:`, updatedBooking);
    } catch (fetchUpdatedError) {
      console.error('Error fetching updated booking:', fetchUpdatedError);
      return new Response(JSON.stringify({ error: 'Error fetching updated booking details.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 7. Check if all participants have confirmed
    const allConfirmed = updatedBooking.participants.every((p) => p.response === 'CONFIRMED');
    console.log(`All Participants Confirmed: ${allConfirmed}`);

    // 8. If all confirmed and booking not yet confirmed, update status and integrate with Google Calendar
    if (allConfirmed && updatedBooking.status !== 'CONFIRMED') {
      console.log(`All participants confirmed. Updating booking status to 'CONFIRMED'.`);

      try {
        // 8.1. Update booking status to 'CONFIRMED'
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: 'CONFIRMED',
          },
        });

        console.log(`Booking ID ${booking.id} status updated to 'CONFIRMED'.`);

        // 8.2. Google Calendar Integration
        try {
          await createGoogleCalendarEvent(updatedBooking);

          // Re-fetch the booking to get the updated googleEventId
          updatedBooking = await prisma.booking.findUnique({
            where: { id: booking.id },
            include: {
              participants: { include: { user: true } },
              organizer: { include: { calendar: true } },
              event: true,
            },
          });

          await inviteParticipantsToGoogleEvent(updatedBooking);
          console.log(`Google Calendar event created and participants invited for Booking ID ${booking.id}.`);
        } catch (calendarError) {
          console.error('Google Calendar Integration Error:', calendarError);
        }
      } catch (statusUpdateError) {
        console.error('Error updating booking status:', statusUpdateError);
        return new Response(JSON.stringify({ error: 'Error updating booking status.' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // 9. Return a successful response
    console.log(`Confirmation successful for Booking ID ${bookingId} by User ID ${user.id}`);
    console.log(`--- Booking Confirmation Request End ---\n`);
    return new Response(JSON.stringify({ message: 'Your response has been recorded.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    // 10. Catch-all Error Handling
    console.error('Unexpected Error in Booking Confirmation:', err);

    // Attempt to return a JSON response if possible
    try {
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (jsonError) {
      // If even sending JSON fails, return a plain text response
      return new Response('Internal Server Error', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  }
}
