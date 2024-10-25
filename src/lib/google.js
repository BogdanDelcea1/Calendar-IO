// src/lib/google.js

import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'https://consilier-delcea.online/auth/google/callback'; // Ensure this matches the URI in GCP

const prisma = new PrismaClient();

export async function getOAuth2Client(userId) {
  const oauth2Client = new OAuth2Client(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );

  // Fetch the user's tokens from the database
  const googleSyncToken = await prisma.googleSyncToken.findUnique({
    where: { userId },
  });

  if (!googleSyncToken) {
    throw new Error('No Google authentication tokens found for user.');
  }

  oauth2Client.setCredentials({
    access_token: googleSyncToken.accessToken,
    refresh_token: googleSyncToken.refreshToken,
    token_type: googleSyncToken.tokenType,
    expiry_date: googleSyncToken.expiryDate.getTime(),
  });

  // Check if the access token is expired
  if (Date.now() >= googleSyncToken.expiryDate.getTime()) {
    // Refresh the access token
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);

    // Update the tokens in the database
    await prisma.googleSyncToken.update({
      where: { userId },
      data: {
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token || googleSyncToken.refreshToken,
        tokenType: credentials.token_type,
        expiryDate: new Date(credentials.expiry_date),
      },
    });
  }

  return oauth2Client;
}
