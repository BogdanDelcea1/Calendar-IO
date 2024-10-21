// src/routes/api/login/+server.js

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { serialize } from 'cookie';
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';

config(); // Load environment variables

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

// Define the login schema using Zod for validation
const loginSchema = z.object({
  username: z.string().optional(),
  email: z.string().email('Invalid email address.').optional(),
  password: z.string(),
});

export async function POST({ request }) {
  try {
    // Parse and validate the incoming JSON data
    const data = await request.json();
    const { username, email, password } = loginSchema.parse(data);

    // Ensure that either username or email is provided
    if (!username && !email) {
      return new Response(JSON.stringify({ error: 'Please provide a username or email.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Find the user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
        ],
      },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid credentials.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Compare the provided password with the stored hash
    const validPassword = await bcrypt.compare(password, user.passwordHash);

    if (!validPassword) {
      return new Response(JSON.stringify({ error: 'Invalid credentials.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create a JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set a cookie with the JWT token
    const cookie = serialize('session', token, {
      httpOnly: true,
      path: '/',
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production', // Ensure secure in production
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return new Response(JSON.stringify({ message: 'Login successful.' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie, // Use the serialized cookie
      },
    });
  } catch (err) {
    // Handle validation errors or other unexpected errors
    const errorMessage =
      err instanceof z.ZodError
        ? err.errors.map((e) => e.message).join(' ')
        : 'An unexpected error occurred.';
    console.error('Login Error:', err);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
