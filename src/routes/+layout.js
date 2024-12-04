// src/routes/+layout.server.js

import { PrismaClient } from '@prisma/client';
import { dev } from '$app/environment';
import { injectAnalytics } from '@vercel/analytics/sveltekit';
import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';


injectAnalytics({ mode: dev ? 'development' : 'production' });
injectSpeedInsights();


const prisma = new PrismaClient();

export const load = async ({ locals }) => {
  const user = locals.user || null;
  let pendingRequests = 0;

  if (user) {
    // Convert binary profile image to Base64 string
    if (user.profileImage) {
      // Convert binary data to a Base64 string
      const base64String = Buffer.from(user.profileImage).toString('base64');
      // Include the data URL prefix
      user.profileImage = `data:image/jpeg;base64,${base64String}`;
    }

    // Count pending booking requests
    pendingRequests = await prisma.bookingParticipant.count({
      where: {
        userId: user.id,
        response: 'PENDING',
      },
    });
  }

  return {
    user,
    pendingRequests,
  };
};
