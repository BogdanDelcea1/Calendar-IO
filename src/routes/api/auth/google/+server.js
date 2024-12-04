//src/routes/api/auth/google/+server.js
import { google } from 'googleapis';
// Correct import statement in +server.js
import jwt from 'jsonwebtoken';


const oauth2Client = new google.auth.OAuth2(
  'YOUR_CLIENT_ID',
  'YOUR_CLIENT_SECRET',
  'http://localhost:5173/api/auth/google/callback'
);

export async function GET() {
  const scopes = ['https://www.googleapis.com/auth/calendar'];
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });

  return Response.redirect(url);
}
