// src/routes/api/delete-account/+server.js

import { PrismaClient } from '@prisma/client';
import { parse } from 'cookie';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
import { serialize } from 'cookie';

config();

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

export async function POST({ request }) {
  try {
    const { password } = await request.json();

    // Get the user's session token from cookies
    const cookies = parse(request.headers.get('cookie') || '');
    const token = cookies.session;

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      console.error('JWT Verification Error:', err);
      return new Response(
        JSON.stringify({ error: 'Invalid session' }),
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // Fetch the user from the database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404 }
      );
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return new Response(
        JSON.stringify({ error: 'Incorrect password' }),
        { status: 400 }
      );
    }

    // Delete the user
    await prisma.user.delete({
      where: { id: userId },
    });

    // Clear the session cookie
    const headers = new Headers();
    headers.append(
      'Set-Cookie',
      serialize('session', '', {
        path: '/',
        expires: new Date(0),
      })
    );

    return new Response(
      JSON.stringify({ message: 'Account deleted successfully' }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error('Error deleting account:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}


