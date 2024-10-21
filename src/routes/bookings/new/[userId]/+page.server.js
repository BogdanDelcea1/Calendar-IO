// src/routes/bookings/new/[userId]/+page.server.js

import { redirect, error } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function load({ params, locals }) {
  const { userId } = params;

  console.log(`\n--- Loading Booking Creation Page ---`);
  console.log(`Booking Creation for User ID: ${userId}`);

  if (!userId) {
    console.warn('No userId provided in params.');
    throw redirect(302, '/bookings');
  }

  // Fetch participant user data
  let user;
  try {
    user = await prisma.user.findUnique({
      where: { id: parseInt(userId, 10) },
      select: { id: true, username: true, email: true },
    });

    if (!user) {
      console.warn(`User not found: ID ${userId}`);
      throw redirect(302, '/user-not-found');
    }

    console.log(`Fetched User:`, user);
  } catch (fetchUserError) {
    console.error('Error fetching user:', fetchUserError);
    throw error(500, 'Error fetching user data.');
  }

  // Fetch logged-in user (creator) data from locals
  const loggedInUser = locals.user;

  if (!loggedInUser) {
    console.warn('No logged-in user found.');
    throw redirect(302, '/login');
  }

  console.log(`Logged-in User ID: ${loggedInUser.id}`);

  // Fetch other users to select as participants, excluding the organizer
  let users;
  try {
    users = await prisma.user.findMany({
      where: { NOT: { id: loggedInUser.id } }, // Exclude the organizer
      select: { id: true, username: true },
    });

    console.log(`Fetched Participants:`, users);
  } catch (fetchParticipantsError) {
    console.error('Error fetching participants:', fetchParticipantsError);
    throw error(500, 'Error fetching participants.');
  }

  console.log(`--- Booking Creation Page Loaded Successfully ---\n`);

  return {
    user,
    creator: loggedInUser,
    users,
  };
}
