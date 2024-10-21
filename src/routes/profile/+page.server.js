// src/routes/profile/+page.server.js

import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { redirect, fail } from '@sveltejs/kit';

const prisma = new PrismaClient();

const profileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const load = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    throw redirect(302, '/login');
  }

  // Fetch the user data from the database
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      profileImage: true,
    },
  });

  return {
    user: dbUser,
  };
};

export const actions = {
  default: async ({ request, locals }) => {
    const user = locals.user;

    if (!user) {
      return fail(401, { error: 'Unauthorized' });
    }

    try {
      const formData = await request.formData();

      const firstName = formData.get('firstName') || undefined;
      const lastName = formData.get('lastName') || undefined;
      const profileImage = formData.get('profileImage');

      // Validate the text fields
      const profileData = profileSchema.parse({ firstName, lastName });

      // Handle profile image upload
      if (
        profileImage &&
        typeof profileImage === 'object' &&
        profileImage.size > 0
      ) {
        const maxSize = 2 * 1024 * 1024; // 2 MB

        if (profileImage.size > maxSize) {
          return fail(400, {
            error: 'Image size exceeds the maximum allowed size of 2 MB.',
          });
        }

        const arrayBuffer = await profileImage.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileType = profileImage.type;
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];

        if (!allowedTypes.includes(fileType)) {
          return fail(400, {
            error: 'Invalid file type. Please upload an image file.',
          });
        }

        // Store the image data in the database
        profileData.profileImage = buffer;
      }

      // Update the user's profile in the database
      await prisma.user.update({
        where: { id: user.id },
        data: profileData,
      });

      // Fetch the updated user data
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          profileImage: true,
        },
      });

      return {
        success: true,
        user: updatedUser,
      };
    } catch (err) {
      console.error('Profile Update Error:', err);

      // Handle Zod validation errors
      if (err instanceof z.ZodError) {
        const errors = err.flatten();
        return fail(400, { errors });
      }

      return fail(500, { error: 'Failed to update profile.' });
    }
  },
};
