import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 0. Clean up existing data to ensure idempotency
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.song.deleteMany({});
  await prisma.album.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.artist.deleteMany({});
  await prisma.role.deleteMany({});

  // 1. Create Default Roles with permissions structure
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      permissions: {
        all: true,
      },
    },
  });

  const staffRole = await prisma.role.upsert({
    where: { name: 'STAFF' },
    update: {},
    create: {
      name: 'STAFF',
      permissions: {
        'tickets:verify': true,
        'events:read': true,
      },
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: {
      name: 'USER',
      permissions: {
        'orders:create': true,
        'orders:read': true,
        'tickets:read': true,
      },
    },
  });

  console.log('✅ Created default security roles.');

  // 2. Create default Admin User
  const defaultAdmin = await prisma.user.upsert({
    where: { email: 'admin@afronile.com' },
    update: {},
    create: {
      email: 'admin@afronile.com',
      passwordHash: '$2b$10$EPf9jthG2d/sQnQhS6M6p.wH7QG9U6B8V1S1cT3QGz2J5w4A6hK2a',
      roleId: adminRole.id,
    },
  });

  const defaultUser = await prisma.user.upsert({
    where: { email: 'user@afronile.com' },
    update: {},
    create: {
      email: 'user@afronile.com',
      passwordHash: '$2b$10$EPf9jthG2d/sQnQhS6M6p.wH7QG9U6B8V1S1cT3QGz2J5w4A6hK2a',
      roleId: userRole.id,
    },
  });

  console.log('✅ Created default seed users.');

  // 3. Create Artist profile
  const artist = await prisma.artist.upsert({
    where: { slug: 'afronile' },
    update: {},
    create: {
      stageName: 'AfroNile',
      slug: 'afronile',
      bio: 'Pioneering Egypt-infused Afrobeat grooves and global soundwaves.',
      socialLinks: {
        spotify: 'https://open.spotify.com/artist/mock',
        instagram: 'https://instagram.com/afronile',
        youtube: 'https://youtube.com/afronile',
      },
    },
  });

  console.log('✅ Created artist profile.');

  // 4. Create Album & Songs with real MP3 assets
  const album = await prisma.album.create({
    data: {
      artistId: artist.id,
      title: 'Nile Waves',
      priceCents: 1999, // $19.99
      releaseDate: new Date('2026-06-30'),
      coverImageUrl: '/nile_waves_album_art.jpg',
      songs: {
        create: [
          {
            title: 'Them Twin Rays',
            trackNumber: 1,
            audioUrl: '/audio/AfroNile_Volume 1_1_Them Twin Rays_32f_44.1k.mp3',
            durationSeconds: 260,
          },
          {
            title: 'Ye Desta Enba',
            trackNumber: 2,
            audioUrl: '/audio/AfroNile_Volume 1_2_Ye Desta Enba_32f_44.1k.mp3',
            durationSeconds: 247,
          },
          {
            title: 'Africa Unite (ft. Mickey Hasset)',
            trackNumber: 3,
            audioUrl: '/audio/AfroNile_Volume 1_3_Africa Unite ft.Mickey Hasset_32f_44.1k.mp3',
            durationSeconds: 184,
          },
          {
            title: 'Ayy Fikir',
            trackNumber: 4,
            audioUrl: '/audio/AfroNile_Volume 1_4_Ayy Fikir_32f_44.1k.mp3',
            durationSeconds: 219,
          },
          {
            title: 'Chewata (ft. Befi Yad)',
            trackNumber: 5,
            audioUrl: '/audio/AfroNile - Chewata ft. Befi Yad.mp3',
            durationSeconds: 193,
          },
          {
            title: 'Accord',
            trackNumber: 6,
            audioUrl: '/audio/AfroNile_Accord_32f_44.1k.mp3',
            durationSeconds: 233,
          },
          {
            title: 'Fafqot (ft. Ben)',
            trackNumber: 7,
            audioUrl: '/audio/AfroNile_Fafqot Ft. Ben_32f_44.1k.mp3',
            durationSeconds: 173,
          },
          {
            title: "Fela's Love",
            trackNumber: 8,
            audioUrl: "/audio/AfroNile_Fela's Love_32f_44.1k.mp3",
            durationSeconds: 163,
          },
          {
            title: 'Nafqot (ft. Liya)',
            trackNumber: 9,
            audioUrl: '/audio/AfroNile_Nafqot ft. Liya_32f_44.1k.mp3',
            durationSeconds: 216,
          },
          {
            title: 'Zemanay (ft. Nhatty Man)',
            trackNumber: 10,
            audioUrl: '/audio/AfroNile_Zemanay Ft. Nhatty Man_32f_44.1k.mp3',
            durationSeconds: 221,
          },
        ],
      },
    },
  });

  console.log('✅ Created album and tracklist.');

  // 5. Create ticketed Events
  const event = await prisma.event.create({
    data: {
      artistId: artist.id,
      title: 'Nile Waves Album Release Tour',
      venueName: 'Pyramids Arena',
      venueAddress: 'Giza Plateau, Cairo, Egypt',
      eventDate: new Date('2026-10-15T20:00:00Z'),
    },
  });

  console.log('✅ Created live tour events.');

  // 6. Create commerce Products (SKUs must match checkout expectations)
  const albumProduct = await prisma.product.upsert({
    where: { sku: `ALBUM_${album.id}` },
    update: {},
    create: {
      type: 'VIP_EXPERIENCE',
      title: 'Nile Waves - Full Digital Album & Vault Access',
      priceCents: 1999,
      sku: `ALBUM_${album.id}`,
      stockQuantity: 999999, // infinite digital items
    },
  });

  const merchProduct = await prisma.product.upsert({
    where: { sku: 'MERCH_TSHIRT_BLACK_L' },
    update: {},
    create: {
      type: 'MERCHANDISE',
      title: 'AfroNile Nile Waves Tour Tee (Black / Large)',
      priceCents: 3500, // $35.00
      sku: 'MERCH_TSHIRT_BLACK_L',
      stockQuantity: 150,
    },
  });

  const ticketProduct = await prisma.product.upsert({
    where: { sku: `TICKET_${event.id}` },
    update: {},
    create: {
      type: 'TICKET_DIGITAL',
      title: 'General Admission - Nile Waves Release Concert',
      priceCents: 4500, // $45.00
      sku: `TICKET_${event.id}`,
      stockQuantity: 500,
    },
  });

  console.log('✅ Created digital and physical store merchandise catalog.');
  console.log('🌱 Seeding process complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
