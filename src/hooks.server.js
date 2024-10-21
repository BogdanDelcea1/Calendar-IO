// src/hooks.server.js

import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
import { parse } from 'cookie';

config();

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

export async function handle({ event, resolve }) {
  const cookieHeader = event.request.headers.get('cookie');
  let user = null;

  if (cookieHeader) {
    const cookies = parse(cookieHeader);
    const token = cookies.session;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            username: true,
            email: true,
            profileImage: true,
            firstName: true,
            lastName: true,
          },
        });
      } catch (err) {
        console.error('JWT Verification Error:', err);
      }
    }
  }

  event.locals.user = user;

  return resolve(event);
}
