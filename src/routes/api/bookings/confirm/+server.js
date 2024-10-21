import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST({ request, locals }) {
  try {
    const { title, duration, platform, startTime, endTime, creatorId, eventId, participantId } = await request.json();

    // Ensure all required fields are present
    if (!title || !duration || !platform || !startTime || !endTime || !creatorId || !participantId) {
      console.error('Missing fields in the request:', { title, duration, platform, startTime, endTime, creatorId, participantId });
      return new Response(JSON.stringify({ error: 'All fields are required.' }), { status: 400 });
    }

    // Upsert the event
    const event = await prisma.event.upsert({
      where: { id: eventId || 0 },
      update: {},
      create: {
        title,
        duration,
        platform,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        creator: {
          connect: { id: creatorId } // Connect creator
        },
        user: {
          connect: { id: participantId } // Connect participant to the event
        }
      }
    });

    // Create or update the booking associated with the event
    const booking = await prisma.booking.create({
      data: {
        event: {
          connect: { id: event.id } // Connect to the event using the event ID
        },
        participant: {
          connect: { id: participantId } // Connect to the participant (invited person)
        },
        organizer: {
          connect: { id: creatorId } // Connect to the organizer (person creating the booking)
        },
        status: 'CONFIRMED'
      }
    });

    console.log('Booking confirmed successfully:', booking);

    // Respond with the newly created booking
    return new Response(JSON.stringify({ message: 'Booking confirmed successfully.', booking }), { status: 200 });
  } catch (error) {
    console.error('Error confirming booking:', error);
    return new Response(JSON.stringify({ error: 'An error occurred while confirming the booking.' }), { status: 500 });
  }
}
