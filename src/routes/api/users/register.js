// src/routes/api/users/register.js

import prisma from '$lib/prisma';
import bcrypt from 'bcrypt';
import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  const { username, password } = await request.json();

  // Validate input
  if (!username || !password) {
    return json({ error: 'Username and password are required.' }, { status: 400 });
  }

  try {
    // Check if the username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return json({ error: 'Username already taken.' }, { status: 400 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });

    return json({ message: 'User registered successfully.' }, { status: 201 });
  } catch (err) {
    console.error('Error registering user:', err);
    return json({ error: 'Failed to register user.' }, { status: 500 });
  }
}
