// src/routes/bookings/new/[userId]/confirm/+page.server.js

import { redirect, error } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Define the schema for query parameters using Zod
const bookingSchema = z.object({
  title: z.string(),
  duration: z.number().positive(),
  platform: z.string(),
  startTime: z.string(),
  endTime: z.string(),
});

export async function load({ params, locals, url }) {
  try {
    // Ensure the user is authenticated
    if (!locals.user) {
      console.warn('Unauthenticated access attempt to booking confirmation.');
      throw redirect(302, '/login');
    }

    const creatorId = parseInt(params.userId, 10);
    const eventId = parseInt(params.eventId, 10);

    // Parse and validate query parameters
    const query = bookingSchema.parse({
      title: url.searchParams.get('title'),
      duration: parseInt(url.searchParams.get('duration'), 10),
      platform: url.searchParams.get('platform'),
      startTime: url.searchParams.get('startTime'),
      endTime: url.searchParams.get('endTime'),
    });

    const { title, duration, platform, startTime, endTime } = query;

    if (isNaN(creatorId) || isNaN(eventId)) {
      console.error('Invalid creator ID or event ID:', params.userId, params.eventId);
      throw error(400, 'Invalid creator ID or event ID.');
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

    return {
      creator: {
        id: creator.id,
        username: creator.username,
      },
      bookingDetails: {
        title,
        duration,
        platform,
        startTime,
        endTime,
      },
      eventId,
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
      const eventId = parseInt(params.eventId, 10);
      const userId = locals.user.id;

      if (isNaN(creatorId) || isNaN(eventId)) {
        console.error('Invalid creator ID or event ID:', params.userId, params.eventId);
        throw error(400, 'Invalid creator ID or event ID.');
      }

      const data = await request.formData();
      const title = data.get('title')?.trim();
      const duration = parseInt(data.get('duration'), 10);
      const platform = data.get('platform')?.trim();
      const startTime = new Date(data.get('startTime'));
      const endTime = new Date(data.get('endTime'));

      // Validate inputs
      if (!title || !platform || isNaN(duration) || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        console.error('Missing or invalid form data:', { title, duration, platform, startTime, endTime });
        throw error(400, 'Missing or invalid form data.');
      }

      // Validate that startTime is before endTime
      if (startTime >= endTime) {
        console.error('Start time must be before end time.');
        throw error(400, 'Start time must be before end time.');
      }

      // Update the booking status to 'CONFIRMED'
      const booking = await prisma.booking.update({
        where: { id: eventId },
        data: {
          status: 'CONFIRMED',
        },
      });

      console.log('Booking confirmed successfully:', booking);

      // Redirect to calendar or success page
      throw redirect(303, '/calendar');
    } catch (err) {
      console.error('Error confirming booking:', err);
      throw error(500, 'An error occurred while confirming the booking.');
    }
  },
};
