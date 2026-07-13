import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Database seed must not run in production.');
  }

  console.log('🌱 Starting database seeding (development only)...');

  // 0. Clean up existing data to ensure idempotency
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.song.deleteMany({});
  await prisma.album.deleteMany({});
  await prisma.contentPost.deleteMany({});
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

  // 2. Create default Users
  const defaultAdmin = await prisma.user.upsert({
    where: { email: 'admin@afronile.com' },
    update: {
      passwordHash: '$2a$10$yTIWdSLSG6NiBQk3UB6S.e2hVnYXLtkNfbWUxRz1iP7kNWWfT8Hme',
    },
    create: {
      email: 'admin@afronile.com',
      passwordHash: '$2a$10$yTIWdSLSG6NiBQk3UB6S.e2hVnYXLtkNfbWUxRz1iP7kNWWfT8Hme',
      roleId: adminRole.id,
    },
  });

  const defaultUser = await prisma.user.upsert({
    where: { email: 'user@afronile.com' },
    update: {
      passwordHash: '$2a$10$yTIWdSLSG6NiBQk3UB6S.e2hVnYXLtkNfbWUxRz1iP7kNWWfT8Hme',
    },
    create: {
      email: 'user@afronile.com',
      passwordHash: '$2a$10$yTIWdSLSG6NiBQk3UB6S.e2hVnYXLtkNfbWUxRz1iP7kNWWfT8Hme',
      roleId: userRole.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'staff@afronile.com' },
    update: {
      passwordHash: '$2a$10$yTIWdSLSG6NiBQk3UB6S.e2hVnYXLtkNfbWUxRz1iP7kNWWfT8Hme',
    },
    create: {
      email: 'staff@afronile.com',
      passwordHash: '$2a$10$yTIWdSLSG6NiBQk3UB6S.e2hVnYXLtkNfbWUxRz1iP7kNWWfT8Hme',
      roleId: staffRole.id,
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
      bio: 'Pioneering East African Afrobeat grooves and global soundwaves.',
      socialLinks: {
        spotify: 'https://open.spotify.com/artist/4X9z8e4b8rT7k9m2Q',
        instagram: 'https://instagram.com/afronile.music',
        youtube: 'https://youtube.com/c/AfroNileOfficial',
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

  // 5. Create multiple real tour events
  const cairoEvent = await prisma.event.create({
    data: {
      artistId: artist.id,
      title: 'Nile Waves Album Release Concert',
      venueName: 'The Dome',
      venueAddress: 'Nairobi, Kenya',
      eventDate: new Date('2026-10-15T20:00:00Z'),
    },
  });

  const alexEvent = await prisma.event.create({
    data: {
      artistId: artist.id,
      title: 'Nile Waves Live in Kampala',
      venueName: 'National Theatre',
      venueAddress: 'Kampala, Uganda',
      eventDate: new Date('2026-11-12T19:00:00Z'),
    },
  });

  const londonEvent = await prisma.event.create({
    data: {
      artistId: artist.id,
      title: 'Nile Waves London Debut',
      venueName: 'The Jazz Cafe',
      venueAddress: 'Camden Town, London, UK',
      eventDate: new Date('2026-12-05T20:00:00Z'),
    },
  });

  const parisEvent = await prisma.event.create({
    data: {
      artistId: artist.id,
      title: 'Nile Waves Paris Showcase',
      venueName: 'New Morning',
      venueAddress: '10th Arrondissement, Paris, France',
      eventDate: new Date('2026-12-18T20:30:00Z'),
    },
  });

  console.log('✅ Created multiple live tour locations.');

  // 6. Create ContentPosts (News & Blog Posts)
  await prisma.contentPost.createMany({
    data: [
      {
        title: 'AfroNile Announces Nile Waves Album Release Tour',
        slug: 'afronile-announces-nile-waves-album-release-tour',
        type: 'news',
        publishedAt: new Date('2026-06-30T12:00:00Z'),
        bodyHtml: `
          <p class="mb-4 text-zinc-300">We are thrilled to officially announce the release of our debut studio album <strong>Nile Waves</strong>, accompanied by a multi-city live tour starting this fall at the Pyramids Arena.</p>
          <p class="mb-4 text-zinc-300">The Nile Waves tour represents a full-immersion audio-visual experience. By combining ancient Nile instrumentation with modern synthesized Afrobeat structures, the live show will guide listeners through a musical odyssey across Cairo, Alexandria, London, and Paris.</p>
        `,
      },
      {
        title: 'Designing a Cryptographic Gate Check Ticketing Infrastructure',
        slug: 'designing-cryptographic-gate-check-ticketing',
        type: 'blog',
        publishedAt: new Date('2026-06-25T10:30:00Z'),
        bodyHtml: `
          <p class="mb-4 text-zinc-300">In this engineering devlog, we explore our decision to build a zero-overhead ticketing platform using secure SHA-256 signature hashes and atomic double-scan gates locks instead of renting expensive proprietary ticketing software.</p>
          <p class="mb-4 text-zinc-300">By storing unique qr-code hashes directly inside a secure Postgres ledger and executing check-ins using single-row conditional database updates, we completely eliminate double-entry fraud and ticket scalping while retaining 100% data ownership.</p>
        `,
      },
      {
        title: 'Behind the Sound: Recording "Ye Desta Enba" in Nairobi',
        slug: 'recording-ye-desta-enba-nairobi',
        type: 'blog',
        publishedAt: new Date('2026-07-02T14:15:00Z'),
        bodyHtml: `
          <p class="mb-4 text-zinc-300">Take an inside look at how "Ye Desta Enba" was recorded in Nairobi. We collaborated with traditional East African multi-instrumentalists playing the Nay (flute) and Oud (lute), fusing their traditional melodies with high-tempo percussion loops.</p>
          <p class="mb-4 text-zinc-300">Our sound engineers captured the resonance of custom copper bells to build the track's distinctive acoustic backbone. Check out the audio player on the homepage to hear the final mix!</p>
        `,
      },
      {
        title: 'Vinyl Production Update: Nile Waves Gatefold Shipping Details',
        slug: 'vinyl-production-update-nile-waves-gatefold',
        type: 'news',
        publishedAt: new Date('2026-07-09T09:00:00Z'),
        bodyHtml: `
          <p class="mb-4 text-zinc-300">Due to overwhelming demand from our fans, our vinyl test pressings for Nile Waves have been completed ahead of schedule by the manufacturing house.</p>
          <p class="mb-4 text-zinc-300">Each vinyl package will be housed in a premium heavyweight gatefold cover featuring concept art of the Nile basin at sunset.</p>
        `,
      }
    ]
  });

  console.log('✅ Created news articles and engineering devlogs.');

  // 7. Create commerce Products (SKUs must match checkout expectations)
  
  // Digital Album
  await prisma.product.upsert({
    where: { sku: `ALBUM_${album.id}` },
    update: {},
    create: {
      type: 'VIP_EXPERIENCE',
      title: 'Nile Waves - Full Digital Album & Vault Access',
      priceCents: 1999,
      sku: `ALBUM_${album.id}`,
      stockQuantity: 999999,
    },
  });

  // Ticket Products for each event
  await prisma.product.upsert({
    where: { sku: `TICKET_${cairoEvent.id}` },
    update: {},
    create: {
      type: 'TICKET_DIGITAL',
      title: 'General Admission - Nile Waves Release Concert (Cairo)',
      priceCents: 4500,
      sku: `TICKET_${cairoEvent.id}`,
      stockQuantity: 500,
    },
  });

  await prisma.product.upsert({
    where: { sku: `TICKET_${alexEvent.id}` },
    update: {},
    create: {
      type: 'TICKET_DIGITAL',
      title: 'General Admission - Roman Amphitheatre Pass (Alexandria)',
      priceCents: 3500,
      sku: `TICKET_${alexEvent.id}`,
      stockQuantity: 350,
    },
  });

  await prisma.product.upsert({
    where: { sku: `TICKET_${londonEvent.id}` },
    update: {},
    create: {
      type: 'TICKET_DIGITAL',
      title: 'General Admission - Jazz Cafe London Showcase',
      priceCents: 5500,
      sku: `TICKET_${londonEvent.id}`,
      stockQuantity: 200,
    },
  });

  await prisma.product.upsert({
    where: { sku: `TICKET_${parisEvent.id}` },
    update: {},
    create: {
      type: 'TICKET_DIGITAL',
      title: 'General Admission - New Morning Showcase (Paris)',
      priceCents: 5000,
      sku: `TICKET_${parisEvent.id}`,
      stockQuantity: 250,
    },
  });

  // Merchandise Items
  await prisma.product.upsert({
    where: { sku: 'MERCH_TSHIRT_BLACK_L' },
    update: {},
    create: {
      type: 'MERCHANDISE',
      title: 'AfroNile Nile Waves Tour Tee (Black / Large)',
      priceCents: 3500,
      sku: 'MERCH_TSHIRT_BLACK_L',
      stockQuantity: 150,
    },
  });

  await prisma.product.upsert({
    where: { sku: 'MERCH_TSHIRT_BLACK_M' },
    update: {},
    create: {
      type: 'MERCHANDISE',
      title: 'AfroNile Nile Waves Tour Tee (Black / Medium)',
      priceCents: 3500,
      sku: 'MERCH_TSHIRT_BLACK_M',
      stockQuantity: 120,
    },
  });

  await prisma.product.upsert({
    where: { sku: 'MERCH_HOODIE_SAND_L' },
    update: {},
    create: {
      type: 'MERCHANDISE',
      title: 'Cairo Sunset Heavyweight Hoodie (Sand / Large)',
      priceCents: 6500,
      sku: 'MERCH_HOODIE_SAND_L',
      stockQuantity: 80,
    },
  });

  await prisma.product.upsert({
    where: { sku: 'MERCH_VINYL_LIMITED' },
    update: {},
    create: {
      type: 'MERCHANDISE',
      title: 'Nile Waves Gatefold 12" Vinyl (Limited Pressing)',
      priceCents: 4000,
      sku: 'MERCH_VINYL_LIMITED',
      stockQuantity: 50,
    },
  });

  await prisma.product.upsert({
    where: { sku: 'MERCH_CAP_EMBROIDERED' },
    update: {},
    create: {
      type: 'MERCHANDISE',
      title: 'AfroNile Signature Embroidered Cap (Dark Olive)',
      priceCents: 2800,
      sku: 'MERCH_CAP_EMBROIDERED',
      stockQuantity: 100,
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
