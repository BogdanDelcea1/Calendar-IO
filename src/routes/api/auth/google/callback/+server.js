//src/routes/api/auth/google/callback/+server.js

import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
// Correct import statement in +server.js
const prisma = new PrismaClient();

const oauth2Client = new google.auth.OAuth2(
  'YOUR_CLIENT_ID',
  'YOUR_CLIENT_SECRET',
  'http://localhost:5173/api/auth/google/callback'
);

const JWT_SECRET = 'your_jwt_secret';

export async function GET({ url, locals }) {
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('Code not found in query parameters.', { status: 400 });
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2'
    });

    const { data } = await oauth2.userinfo.get();
    const googleEmail = data.email;

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email: googleEmail } });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          username: data.name || data.email.split('@')[0],
          email: googleEmail,
          passwordHash: '', // Since user is authenticating via Google, password is not set
        }
      });
    }

    // Save tokens to database
    await prisma.googleSyncToken.upsert({
      where: { userId: user.id },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenType: tokens.token_type,
        expiryDate: new Date(tokens.expiry_date)
      },
      create: {
        userId: user.id,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenType: tokens.token_type,
        expiryDate: new Date(tokens.expiry_date)
      }
    });

    // Create session token
    const jwtToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1d' });

    const headers = new Headers();
    headers.append(
      'Set-Cookie',
      serialize('session', jwtToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 // 1 day
      })
    );

    headers.append('Location', '/calendar');

    return new Response(null, { status: 302, headers });
  } catch (err) {
    console.error(err);
    return new Response('Authentication failed.', { status: 500 });
  }
}