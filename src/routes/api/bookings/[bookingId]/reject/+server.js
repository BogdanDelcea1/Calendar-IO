// src/routes/api/bookings/[bookingId]/reject/+server.js

import { error, json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { google } from 'googleapis';

const prisma = new PrismaClient();

// Configure Google Calendar API
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

export async function POST({ params, locals }) {
  try {
    // Ensure the user is authenticated
    if (!locals.user) {
      throw error(401, 'Unauthorized');
    }

    const bookingId = parseInt(params.bookingId, 10);
    const userId = locals.user.id;

    if (isNaN(bookingId)) {
      throw error(400, 'Invalid booking ID.');
    }

    // Fetch the booking along with participants and event
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { participants: true, event: true },
    });

    if (!booking) {
      throw error(404, 'Booking not found.');
    }

    // Check if the user is a participant
    const isParticipant = booking.participants.some(p => p.userId === userId);

    if (!isParticipant) {
      console.error(`User is not a participant of the booking: ${userId}`);
      throw error(403, 'You are not authorized to reject this booking.');
    }

    // Prevent double rejection
    if (booking.status !== 'PENDING') {
      throw error(400, `Cannot reject a booking with status '${booking.status}'.`);
    }

    // Update the booking status to 'REJECTED'
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'REJECTED',
      },
      include: { participants: true, event: true },
    });

    console.log('Booking rejected successfully:', updatedBooking);


    return json({ message: 'Booking rejected successfully.' }, { status: 200 });
  } catch (err) {
    console.error('Error rejecting booking:', err);
    // If it's an HttpError (status and message), rethrow it
    if (err instanceof error) {
      throw err;
    }
    // Otherwise, throw a generic server error
    throw error(500, 'An error occurred while rejecting the booking.');
  }
}
