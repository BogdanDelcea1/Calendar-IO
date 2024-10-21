import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET({ locals }) {
  const user = locals.user;

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const settings = await prisma.user_Settings.findUnique({
      where: { userId: user.id }
    });

    return new Response(JSON.stringify(settings), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Failed to fetch settings.' }), { status: 500 });
  }
}

export async function POST({ request, locals }) {
  const user = locals.user;

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const data = await request.json();
  const { receiveEmails } = data;

  try {
    await prisma.user_Settings.upsert({
      where: { userId: user.id },
      update: { receiveEmails },
      create: { userId: user.id, receiveEmails }
    });

    return new Response(JSON.stringify({ message: 'Settings updated.' }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Failed to update settings.' }), { status: 500 });
  }
}
