import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { verifyAdminFromCookies } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    if (!(await verifyAdminFromCookies())) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { title, venueName, venueAddress, eventDate } = await req.json();

    if (!title?.trim() || !venueName?.trim() || !venueAddress?.trim() || !eventDate) {
      return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });
    }

    // Default to the first available artist
    const firstArtist = await prisma.artist.findFirst();
    if (!firstArtist) {
      return NextResponse.json({ error: 'NO_ARTIST_FOUND' }, { status: 400 });
    }

    const parsedDate = new Date(eventDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: 'INVALID_EVENT_DATE' }, { status: 400 });
    }

    const event = await prisma.$transaction(async (tx) => {
      const created = await tx.event.create({
        data: {
          title: title.trim(),
          venueName: venueName.trim(),
          venueAddress: venueAddress.trim(),
          eventDate: parsedDate,
          artistId: firstArtist.id,
        },
      });

      await tx.product.create({
        data: {
          type: 'TICKET_DIGITAL',
          title: `General Admission - ${title.trim()}`,
          priceCents: 4500,
          sku: `TICKET_${created.id}`,
          stockQuantity: 500,
        },
      });

      return created;
    });

    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create event:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!(await verifyAdminFromCookies())) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { id, title, venueName, venueAddress, eventDate } = await req.json();

    if (!id || !title?.trim() || !venueName?.trim() || !venueAddress?.trim() || !eventDate) {
      return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        title: title.trim(),
        venueName: venueName.trim(),
        venueAddress: venueAddress.trim(),
        eventDate: new Date(eventDate),
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    console.error('Failed to update event:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!(await verifyAdminFromCookies())) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'MISSING_ID' }, { status: 400 });
    }

    // Check if tickets are sold for this event to avoid throwing strict DB foreign key errors
    const ticketCount = await prisma.ticket.count({ where: { eventId: id } });
    if (ticketCount > 0) {
      return NextResponse.json({ 
        error: 'EVENT_HAS_SOLD_TICKETS',
        message: 'Cannot delete event because tickets have already been sold. Please cancel the associated orders first.'
      }, { status: 400 });
    }

    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete event:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
