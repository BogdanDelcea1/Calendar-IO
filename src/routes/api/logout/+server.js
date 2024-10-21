// src/routes/api/logout/+server.js

import { serialize } from 'cookie';

export async function POST() {
  const cookie = serialize('session', '', {
    httpOnly: true,
    path: '/',
    sameSite: 'lax', // Use 'lax' or 'strict' as needed
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
  });

  return new Response(JSON.stringify({ message: 'Logged out successfully.' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookie,
    },
  });
}
