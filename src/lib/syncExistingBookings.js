// src/lib/syncExistingBookings.js

import { PrismaClient } from '@prisma/client';
import { sendGoogleCalendarEvent } from './googleCalendar.js'; // Adjust the path as necessary

const prisma = new PrismaClient();

async function syncBookings() {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        googleEventId: null,
        status: 'CONFIRMED', // or appropriate status
      },
      include: {
        event: true,
        participants: {
          include: { user: true },
        },
        organizer: true,
      },
    });

    for (const booking of bookings) {
      console.log(`Synchronizing Booking ID: ${booking.id}`);

      try {
        await sendGoogleCalendarEvent(booking);
        console.log(`Booking ID ${booking.id} synchronized successfully.`);
      } catch (err) {
        console.error(`Failed to synchronize Booking ID ${booking.id}:`, err);
      }
    }

    console.log('Synchronization complete.');
  } catch (err) {
    console.error('Error fetching bookings:', err);
  } finally {
    await prisma.$disconnect();
  }
}

syncBookings();
