// src/routes/bookings/[bookingId]/confirm/+page.server.js

import { error, redirect } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

 //Load function to fetch booking details and pass them to the frontend.
export async function load({ params, locals }) {
  const { bookingId } = params;

  console.log(`\n--- Loading Confirmation Page for Booking ID: ${bookingId} ---`);

  if (!bookingId) {
    console.warn('No bookingId provided in params.');
    throw redirect(302, '/bookings');
  }

  // Ensure the user is authenticated
  const loggedInUser = locals.user;

  if (!loggedInUser) {
    console.warn('No logged-in user found.');
    throw redirect(302, '/login');
  }

  console.log(`Logged-in User ID: ${loggedInUser.id}`);

  // Fetch booking details
  let booking;
  try {
    booking = await prisma.booking.findUnique({
      where: { id: parseInt(bookingId, 10) },
      include: {
        event: true,
        organizer: { select: { id: true, username: true, email: true, calendar: true } },
        participants: {
          include: { user: { select: { id: true, username: true, email: true } } },
        },
      },
    });

    if (!booking) {
      console.warn(`Booking not found: ID ${bookingId}`);
      throw error(404, 'Booking not found.');
    }

    console.log(`Fetched Booking:`, booking);
  } catch (fetchError) {
    console.error('Error fetching booking:', fetchError);
    throw error(500, 'Error fetching booking details.');
  }

  // Check if the logged-in user is a participant or the organizer
  const isParticipant = booking.participants.some(p => p.userId === loggedInUser.id);
  const isOrganizer = booking.organizer.id === loggedInUser.id;

  if (!isParticipant && !isOrganizer) {
    console.warn(`User ID ${loggedInUser.id} is not a participant or organizer of Booking ID ${bookingId}`);
    throw error(403, 'You are not authorized to view this booking.');
  }

  console.log(`User ID ${loggedInUser.id} is authorized to view Booking ID ${bookingId}`);

  return {
    booking,
  };
}
