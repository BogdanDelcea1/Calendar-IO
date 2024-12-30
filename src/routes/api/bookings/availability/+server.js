import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET({ url, locals }) {
  const user = locals.user;

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const targetUserId = parseInt(url.searchParams.get('userId'));
  const duration = parseInt(url.searchParams.get('duration'));

  if (isNaN(targetUserId) || isNaN(duration)) {
    return new Response(JSON.stringify({ error: 'Invalid parameters.' }), { status: 400 });
  }

  try {
    // Fetch both users' events
    const [userEvents, targetUserEvents] = await Promise.all([
      prisma.event.findMany({
        where: { creatorId: user.id }
      }),
      prisma.event.findMany({
        where: { creatorId: targetUserId }
      })
    ]);

    const availability = generateCommonAvailability(userEvents, targetUserEvents, duration);

    return new Response(JSON.stringify(availability), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

function generateCommonAvailability(userEvents, targetUserEvents, duration) {
  // Exclude times where either user has an event
  // Generate time slots
  const slots = [];
  const now = new Date();
  const endDate = new Date();
  endDate.setDate(now.getDate() + 14); // Next two weeks

  for (let d = new Date(now); d <= endDate; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0 || d.getDay() === 6) {
      // Skip weekends
      continue;
    }
    for (let h = 9; h <= 17 - duration / 60; h++) {
      const startTime = new Date(d);
      startTime.setHours(h, 0, 0, 0);
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + duration);

      const slot = { startTime, endTime };

      // Check for conflicts
      const userConflict = userEvents.some(event => timeOverlap(event, slot));
      const targetConflict = targetUserEvents.some(event => timeOverlap(event, slot));

      if (!userConflict && !targetConflict) {
        slots.push(slot);
      }
    }
  }

  // Return top 3 slots
  return slots.slice(0, 3);
}

function timeOverlap(event, slot) {
  return (
    new Date(event.startTime) < slot.endTime &&
    new Date(event.endTime) > slot.startTime
  );
}