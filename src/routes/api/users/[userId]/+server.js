import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET({ params, locals }) {
  const user = locals.user;

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const userId = parseInt(params.userId);

  if (isNaN(userId)) {
    return new Response(JSON.stringify({ error: 'Invalid user ID.' }), { status: 400 });
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true }
    });

    if (!targetUser) {
      return new Response(JSON.stringify({ error: 'User not found.' }), { status: 404 });
    }

    return new Response(JSON.stringify(targetUser), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
