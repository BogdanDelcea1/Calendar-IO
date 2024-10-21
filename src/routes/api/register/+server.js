// src/routes/api/register/+server.js

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const prisma = new PrismaClient();

// Define the registration schema using Zod for validation
const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters long.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters long.'),
});

export async function POST({ request }) {
  try {
    // Parse and validate the incoming JSON data
    const data = await request.json();
    const { username, email, password } = registerSchema.parse(data);

    // Check if the username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return new Response(JSON.stringify({ error: 'Username already taken.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (existingUser.email === email) {
        return new Response(JSON.stringify({ error: 'Email already registered.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create the new user
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
      },
    });

    return new Response(
      JSON.stringify({ message: 'Registration successful. You can now log in.' }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    // Handle validation errors or other unexpected errors
    const errorMessage =
      err instanceof z.ZodError
        ? err.errors.map((e) => e.message).join(' ')
        : 'An unexpected error occurred.';
    console.error('Registration Error:', err);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
