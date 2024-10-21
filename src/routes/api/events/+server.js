import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET({ locals }) {
  const user = locals.user;

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const events = await prisma.event.findMany({
      where: {
        creatorId: user.id
      }
    });

    return new Response(JSON.stringify(events), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
