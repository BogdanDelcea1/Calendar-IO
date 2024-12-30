// src/routes/api/bookings/[bookingId]/delete/+server.js

import { PrismaClient } from '@prisma/client';
import { error } from '@sveltejs/kit';
import { deleteGoogleCalendarEvent } from '$lib/googleCalendar'; 

const prisma = new PrismaClient();

export async function DELETE({ params, locals }) {
  const { bookingId } = params;
  const user = locals.user;

  // 1. Authentication: Verify user is authenticated
  if (!user) {
    throw error(401, 'You must be logged in to perform this action.');
  }

  // 2. Fetch existing booking
  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(bookingId, 10) },
    include: {
      participants: true,
      organizer: true,
      event: true,
    },
  });

  // 3. Booking Not Found
  if (!booking) {
    throw error(404, 'Booking not found.');
  }

  // 4. Authorization: Allow both organizers and participants to delete
  const isOrganizer = booking.organizerId === user.id;
  const isParticipant = booking.participants.some(p => p.userId === user.id);

  if (!isOrganizer && !isParticipant) {
    throw error(403, 'You do not have permission to delete this booking.');
  }

  // 5. Delete Google Calendar Event if exists
  if (booking.googleEventId) {
    try {
      await deleteGoogleCalendarEvent(booking);
      console.log(`Deleted Google Calendar event for Booking ID ${bookingId}`);
    } catch (calendarError) {
      console.error('Error deleting Google Calendar event:', calendarError);
    }
  }

  // 6. Begin Transaction: Delete participants and booking
  try {
    await prisma.$transaction(async (prisma) => {
      // 6.1. Delete all BookingParticipant records associated with the Booking
      await prisma.bookingParticipant.deleteMany({
        where: { bookingId: booking.id },
      });
      console.log(`Deleted all participants for Booking ID ${booking.id}`);

      // 6.2. Delete the Booking
      await prisma.booking.delete({
        where: { id: booking.id },
      });
      console.log(`Deleted Booking ID ${booking.id} successfully.`);
    });

    console.log(`Delete Booking successful for Booking ID ${bookingId} by User ID ${user.id}`);
    return new Response(JSON.stringify({ message: 'Booking deleted successfully.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Delete Booking Error:', err);
    throw error(500, 'Internal Server Error');
  }
}
