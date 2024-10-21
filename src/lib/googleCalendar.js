// src/lib/googleCalendar.js

import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize Google OAuth2 Client once
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

/**
 * Get an authenticated Google Calendar client for a specific user.
 * @param {number} userId - The ID of the user.
 * @returns {google.calendar_v3.Calendar} - The authenticated Google Calendar client.
 */
async function getAuthenticatedCalendarClient(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { googleSyncToken: true },
  });

  if (!user || !user.googleSyncToken) {
    throw new Error('User does not have a valid Google Sync Token.');
  }

  oauth2Client.setCredentials({
    access_token: user.googleSyncToken.accessToken,
    refresh_token: user.googleSyncToken.refreshToken,
    scope: user.googleSyncToken.scope,
    token_type: user.googleSyncToken.tokenType,
    expiry_date: user.googleSyncToken.expiryDate.getTime(),
    id_token: user.googleSyncToken.idToken, // Optional
  });

  // Remove existing listeners to prevent multiple listeners being added
  oauth2Client.removeAllListeners('tokens');

  // Automatically refresh the token if expired
  oauth2Client.on('tokens', async (tokens) => {
    console.log('Received new tokens:', tokens);
    if (tokens.refresh_token) {
      console.log('Updating refresh token in database.');
      await prisma.googleSyncToken.update({
        where: { userId: userId },
        data: {
          refreshToken: tokens.refresh_token,
        },
      });
    }
    if (tokens.access_token) {
      console.log('Updating access token and expiry date in database.');
      await prisma.googleSyncToken.update({
        where: { userId: userId },
        data: {
          accessToken: tokens.access_token,
          expiryDate: new Date(tokens.expiry_date),
        },
      });
    }
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  return calendar;
}

/**
 * Creates a Google Calendar event in the organizer's calendar.
 * @param {Object} booking - The booking object.
 */
export async function createGoogleCalendarEvent(booking) {
  try {
    const organizer = booking.organizer;

    const organizerCalendarId = organizer.calendar?.googleCalendarId || 'primary'; // Default to 'primary' if not set
    if (!organizerCalendarId) {
      throw new Error('Organizer does not have a Google Calendar ID.');
    }

    const event = {
      summary: booking.event.title,
      description: booking.event.description || '',
      start: {
        dateTime: booking.event.startTime.toISOString(),
      },
      end: {
        dateTime: booking.event.endTime.toISOString(),
      },
      reminders: {
        useDefault: true,
      },
    };

    console.log(`Creating Google Calendar event for Booking ID: ${booking.id}`);
    const calendar = await getAuthenticatedCalendarClient(organizer.id);

    const createdEvent = await calendar.events.insert({
      calendarId: organizerCalendarId,
      resource: event,
      sendUpdates: 'all', // Sends notifications to attendees (if any)
    });

    console.log(`Event created on organizer's Google Calendar: ${createdEvent.data.id}`);

    // Store the Google Event ID in the booking for future reference
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        googleEventId: createdEvent.data.id,
      },
    });
  } catch (err) {
    console.error('Error creating Google Calendar event:', err);
    throw err; // Rethrow to handle upstream
  }
}

/**
 * Invites participants to the existing Google Calendar event as attendees.
 * @param {Object} booking - The booking object with googleEventId.
 */
export async function inviteParticipantsToGoogleEvent(booking) {
  try {
    const organizer = booking.organizer;
    const participants = booking.participants
      .filter((p) => p.response === 'CONFIRMED') // Only invite confirmed participants
      .map((p) => p.user);

    const organizerCalendarId = organizer.calendar?.googleCalendarId || 'primary'; // Default to 'primary' if not set
    if (!organizerCalendarId) {
      throw new Error('Organizer does not have a Google Calendar ID.');
    }

    if (!booking.googleEventId) {
      throw new Error('No Google Event ID found for this booking.');
    }

    const attendeeEmails = participants
      .map((p) => p.email)
      .filter((email) => email && email !== organizer.email); // Exclude organizer's email if present

    if (attendeeEmails.length === 0) {
      console.warn('No valid participant emails to invite.');
      return;
    }

    console.log(`Inviting participants to Booking ID: ${booking.id}`);
    const calendar = await getAuthenticatedCalendarClient(organizer.id);

    // Fetch the existing event
    const existingEvent = await calendar.events.get({
      calendarId: organizerCalendarId,
      eventId: booking.googleEventId,
    });

    if (!existingEvent.data.attendees) {
      existingEvent.data.attendees = [];
    }

    // Add new attendees
    attendeeEmails.forEach((email) => {
      if (!existingEvent.data.attendees.some((att) => att.email === email)) {
        existingEvent.data.attendees.push({ email });
      }
    });

    // Update the event with new attendees
    const updatedEvent = await calendar.events.update({
      calendarId: organizerCalendarId,
      eventId: booking.googleEventId,
      resource: existingEvent.data,
      sendUpdates: 'all', // Sends notifications to attendees
    });

    console.log(`Participants invited to the event: ${updatedEvent.data.id}`);
  } catch (err) {
    console.error('Error inviting participants to Google Calendar event:', err);
    throw err; // Rethrow to handle upstream
  }
}

/**
 * Updates a Google Calendar event in the organizer's calendar.
 * @param {Object} booking - The booking object with googleEventId.
 */
export async function updateGoogleCalendarEvent(booking) {
  try {
    const organizer = booking.organizer;
    const participants = booking.participants
      .filter((p) => p.response === 'CONFIRMED') // Only include confirmed participants
      .map((p) => p.user);

    const organizerCalendarId = organizer.calendar?.googleCalendarId || 'primary'; // Default to 'primary' if not set
    if (!organizerCalendarId) {
      throw new Error('Organizer does not have a Google Calendar ID.');
    }

    if (!booking.googleEventId) {
      throw new Error('No Google Event ID found for this booking.');
    }

    const attendeeEmails = participants
      .map((p) => p.email)
      .filter((email) => email && email !== organizer.email); // Exclude organizer's email if present

    const event = {
      summary: booking.event.title,
      description: booking.event.description || '',
      start: {
        dateTime: booking.event.startTime.toISOString(),
      },
      end: {
        dateTime: booking.event.endTime.toISOString(),
      },
      attendees: [
        { email: organizer.email },
        ...attendeeEmails.map((email) => ({ email })),
      ],
      reminders: {
        useDefault: true,
      },
    };

    console.log(`Updating Google Calendar event for Booking ID: ${booking.id}`);
    const calendar = await getAuthenticatedCalendarClient(organizer.id);

    const updatedEvent = await calendar.events.update({
      calendarId: organizerCalendarId,
      eventId: booking.googleEventId,
      resource: event,
      sendUpdates: 'all', // Sends notifications to attendees
    });

    console.log(`Event updated on organizer's Google Calendar: ${updatedEvent.data.id}`);
  } catch (err) {
    console.error('Error updating Google Calendar event:', err);
    throw err; // Rethrow to handle upstream
  }
}

/**
 * Deletes a Google Calendar event from the organizer's calendar.
 * @param {Object} booking - The booking object with googleEventId.
 */
export async function deleteGoogleCalendarEvent(booking) {
  try {
    const organizer = booking.organizer;

    const organizerCalendarId = organizer.calendar?.googleCalendarId || 'primary'; // Default to 'primary' if not set
    if (!organizerCalendarId) {
      throw new Error('Organizer does not have a Google Calendar ID.');
    }

    if (!booking.googleEventId) {
      console.warn('No Google Event ID found for this booking. Skipping deletion.');
      return;
    }

    console.log(`Deleting Google Calendar event for Booking ID: ${booking.id}`);
    const calendar = await getAuthenticatedCalendarClient(organizer.id);

    // Attempt to delete the event
    const response = await calendar.events.delete({
      calendarId: organizerCalendarId,
      eventId: booking.googleEventId,
      sendUpdates: 'all', // Sends notifications to attendees
    });

    if (response.status === 204) {
      console.log(`Google Calendar event deleted: ${booking.googleEventId}`);

      // Remove the googleEventId from the Booking record
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          googleEventId: null,
        },
      });
    } else {
      console.warn(`Unexpected response status when deleting event: ${response.status}`);
    }
  } catch (err) {
    console.error('Error deleting Google Calendar event:', err);

    // Optionally, handle specific error types
    if (err.response) {
      console.error('Google API Response Status:', err.response.status);
      console.error('Google API Response Data:', err.response.data);
    }

    // Rethrow the error to allow the deletion endpoint to handle it
    throw err;
  }
}
