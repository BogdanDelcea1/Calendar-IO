// src/routes/bookings/edit/[bookingId]/+page.server.js

import { error } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function load({ params, locals }) {
  const { bookingId } = params;
  const user = locals.user;

  // 1. Authentication: Verify user is authenticated
  if (!user) {
    throw error(401, 'You must be logged in to view this page.');
  }

  // 2. Fetch existing booking
  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(bookingId, 10) },
    include: {
      event: true,
      participants: true,
      organizer: true,
    },
  });

  // 3. Booking Not Found
  if (!booking) {
    throw error(404, 'Booking not found.');
  }

  // 4. Authorization: Allow both organizers and participants to edit
  const isOrganizer = booking.organizerId === user.id;
  const isParticipant = booking.participants.some(p => p.userId === user.id);

  if (!isOrganizer && !isParticipant) {
    throw error(403, 'You do not have permission to edit this booking.');
  }

  return {
    booking,
  };
}
