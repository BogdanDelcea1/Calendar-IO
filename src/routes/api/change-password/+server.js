import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const prisma = new PrismaClient();

const passwordSchema = z.object({
  oldPassword: z.string().min(6),
  newPassword: z.string().min(6),
  confirmPassword: z.string().min(6)
});

export async function POST({ request, locals }) {
  const user = locals.user;

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const data = await request.json();

  try {
    const { oldPassword, newPassword, confirmPassword } = passwordSchema.parse(data);

    if (newPassword !== confirmPassword) {
      return new Response(JSON.stringify({ error: 'New passwords do not match.' }), { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: user.id } });

    const validPassword = await bcrypt.compare(oldPassword, currentUser.passwordHash);

    if (!validPassword) {
      return new Response(JSON.stringify({ error: 'Old password is incorrect.' }), { status: 400 });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash }
    });

    return new Response(JSON.stringify({ message: 'Password updated successfully.' }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Failed to change password.' }), { status: 500 });
  }
}