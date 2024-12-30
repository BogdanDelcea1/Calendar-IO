// src/routes/bookings/new/[userId]/confirm/[eventId]/+page.server.js

import { redirect, error } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function load({ params, locals, url }) {
  try {
    // Ensure the user is authenticated
    if (!locals.user) {
      console.warn('Unauthenticated access attempt to booking confirmation.');
      throw redirect(302, '/login');
    }

    const creatorId = parseInt(params.userId, 10);
    const bookingId = parseInt(params.eventId, 10); 

    if (isNaN(creatorId) || isNaN(bookingId)) {
      console.error('Invalid creator ID or booking ID:', params.userId, params.eventId);
      throw error(400, 'Invalid creator ID or booking ID.');
    }

    // Retrieve the creator's details
    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
      select: { id: true, username: true },
    });

    if (!creator) {
      console.error('Creator not found with ID:', creatorId);
      throw error(404, 'Creator not found.');
    }

    // Retrieve booking details from query parameters
    const bookingDetails = {
      title: url.searchParams.get('title') || '',
      duration: parseInt(url.searchParams.get('duration'), 10),
      platform: url.searchParams.get('platform') || '',
      startTime: url.searchParams.get('startTime') || '',
      endTime: url.searchParams.get('endTime') || '',
    };

    // Validate booking details
    if (
      !bookingDetails.title ||
      !bookingDetails.platform ||
      isNaN(bookingDetails.duration) ||
      !bookingDetails.startTime ||
      !bookingDetails.endTime
    ) {
      console.error('Missing or invalid booking details:', bookingDetails);
      throw error(400, 'Missing or invalid booking details.');
    }

    // Log booking details for debugging
    console.log('Booking Details:', bookingDetails);

    return {
      creator: {
        id: creator.id,
        username: creator.username,
      },
      bookingDetails: {
        title: String(bookingDetails.title),
        duration: Number(bookingDetails.duration),
        platform: String(bookingDetails.platform),
        startTime: String(bookingDetails.startTime),
        endTime: String(bookingDetails.endTime),
      },
      bookingId,
    };
  } catch (err) {
    console.error('Error loading booking confirmation:', err);
    throw error(500, 'Failed to load booking confirmation.');
  }
}

export const actions = {
  default: async ({ request, params, locals }) => {
    try {
      // Ensure the user is authenticated
      if (!locals.user) {
        console.warn('Unauthorized form submission attempt.');
        throw error(401, 'Unauthorized');
      }

      const creatorId = parseInt(params.userId, 10);
      const bookingId = parseInt(params.eventId, 10);
      const participantId = locals.user.id;

      if (isNaN(creatorId) || isNaN(bookingId) || isNaN(participantId)) {
        console.error('Invalid creator ID, booking ID, or participant ID:', {
          creatorId,
          bookingId,
          participantId,
        });
        throw error(400, 'Invalid creator ID, booking ID, or participant ID.');
      }

      // Retrieve the booking to ensure it exists and the participant is part of it
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { participants: true },
      });

      if (!booking) {
        console.error('Booking not found with ID:', bookingId);
        throw error(404, 'Booking not found.');
      }

      // Check if the participant is part of the booking
      const isParticipant = booking.participants.some(
        (participant) => participant.userId === participantId
      );

      if (!isParticipant) {
        console.error('User is not a participant of the booking:', participantId);
        throw error(403, 'You are not authorized to confirm this booking.');
      }

      // Update the booking status to 'CONFIRMED'
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CONFIRMED',
        },
      });

      console.log('Booking confirmed successfully:', updatedBooking);

      // Redirect to calendar
      throw redirect(303, '/bookings/mine');
    } catch (err) {
      console.error('Error confirming booking:', err);
      // If it's an HttpError (status and message), rethrow it
      if (err.status && err.message) {
        throw error(err.status, err.message);
      }
      // Otherwise, throw a generic server error
      throw redirect(303, '/bookings/mine');
    }
  },
};
