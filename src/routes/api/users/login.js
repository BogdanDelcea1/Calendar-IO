// src/routes/api/users/login.js

import prisma from '$lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private'; // Import environment variables

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return json({ error: 'Username and password are required.' }, { status: 400 });
  }

  try {
    // Find the user by username
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return json({ error: 'Invalid username or password.' }, { status: 400 });
    }

    // Compare passwords
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return json({ error: 'Invalid username or password.' }, { status: 400 });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Set the token in an HTTP-only cookie
    cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60, // 1 hour
    });

    return json({ message: 'Login successful.' }, { status: 200 });
  } catch (err) {
    console.error('Error logging in:', err);
    return json({ error: 'Failed to login.' }, { status: 500 });
  }
}
