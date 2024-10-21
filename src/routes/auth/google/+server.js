// src/routes/auth/google/+server.js

import { OAuth2Client } from 'google-auth-library';
import { redirect } from '@sveltejs/kit';
import { config } from 'dotenv';

config(); // Load environment variables

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'https://localhost:443/auth/google/callback'; // Ensure this matches the URI in GCP

const oauth2Client = new OAuth2Client(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

export function GET() {
  const scopes = [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/calendar', // For calendar access
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Get refresh token
    scope: scopes,
    prompt: 'consent', // Force consent to get refresh token
  });

  throw redirect(302, url);
}
