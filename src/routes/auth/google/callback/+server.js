// src/routes/auth/google/callback/+server.js

import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';
import { serialize } from 'cookie';
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;
const REDIRECT_URI = 'https://localhost:443/auth/google/callback'; // Ensure this matches the URI in GCP

const oauth2Client = new OAuth2Client(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

export async function GET({ url }) {
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('Authorization code not found', { status: 400 });
  }

  try {
    // Get tokens (access token and refresh token)
    const { tokens } = await oauth2Client.getToken(code);

    // Set the credentials to the OAuth2 client
    oauth2Client.setCredentials(tokens);

    // Get user info
    const userInfoClient = oauth2Client;
    const userInfo = await userInfoClient.request({
      url: 'https://www.googleapis.com/oauth2/v2/userinfo',
    });

    const { email, name, picture } = userInfo.data;

    // Check if user exists in the database
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create a new user
      user = await prisma.user.create({
        data: {
          email,
          username: name.replace(/\s+/g, '').toLowerCase(), // Simple username from name
          firstName: name.split(' ')[0],
          lastName: name.split(' ')[1] || '',
          profileImage: picture,
          googleSyncToken: {
            create: {
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token,
              tokenType: tokens.token_type,
              expiryDate: new Date(tokens.expiry_date),
            },
          },
        },
        include: {
          googleSyncToken: true,
        },
      });
    } else {
      // Update the user's tokens
      await prisma.googleSyncToken.upsert({
        where: { userId: user.id },
        update: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || undefined, // Refresh token is only sent on first consent
          tokenType: tokens.token_type,
          expiryDate: new Date(tokens.expiry_date),
        },
        create: {
          userId: user.id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenType: tokens.token_type,
          expiryDate: new Date(tokens.expiry_date),
        },
      });
    }

    // Create a JWT token for session management
    const jwtToken = jwt.sign(
      {
        userId: user.id,
        username: user.username,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set the session cookie with 'SameSite' set to 'lax'
    const cookie = serialize('session', jwtToken, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax', // Changed from 'strict' to 'lax'
      //secure: process.env.NODE_ENV === 'production', // true in production, false otherwise
      secure: true,
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    // Redirect to the dashboard or desired page
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/calendar',
        'Set-Cookie': cookie,
      },
    });
  } catch (error) {
    console.error('Google OAuth Error:', error);
    return new Response('Authentication failed', { status: 500 });
  }
}
