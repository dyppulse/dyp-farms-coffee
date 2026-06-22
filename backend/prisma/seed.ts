import { PrismaClient, SlotStatus, TourType } from '@prisma/client';

const prisma = new PrismaClient();

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function dateOnly(d: Date): Date {
  return new Date(d.toISOString().split('T')[0]);
}

async function main() {
  await prisma.paymentAttempt.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.tourSlot.deleteMany();
  await prisma.review.deleteMany();
  await prisma.tour.deleteMany();

  const tours = [
    {
      id: 'tour-1',
      title: 'Farm Tour & Harvest Experience',
      description:
        'Walk through our lush coffee estates, meet the farmers, and participate in a live harvest session.',
      type: TourType.tour,
      duration: '4 hours',
      rating: 4.8,
      reviewCount: 24,
      locationName: 'Dyp Farms Estate, Mbale',
      address: 'Bududa Road, Wanale Ridge',
      city: 'Mbale',
      country: 'Uganda',
      latitude: 1.0821,
      longitude: 34.175,
      pricePerGuest: 85000,
      bookingFee: 5000,
    },
    {
      id: 'tour-2',
      title: 'Farm Accommodations',
      description:
        'Stay overnight in our eco-lodge nestled among the coffee trees. Includes breakfast and cupping session.',
      type: TourType.accommodation,
      duration: '1 night',
      rating: 4.9,
      reviewCount: 18,
      locationName: 'Dyp Farms Eco-Lodge, Mbale',
      address: 'Wanale Ridge, Mbale District',
      city: 'Mbale',
      country: 'Uganda',
      latitude: 1.0835,
      longitude: 34.178,
      pricePerGuest: 150000,
      bookingFee: 10000,
    },
    {
      id: 'tour-3',
      title: 'Premium Tasting Session',
      description:
        'Guided cupping of our finest lots with our head roaster. Learn to identify flavor profiles and grades.',
      type: TourType.tasting,
      duration: '2 hours',
      rating: 4.7,
      reviewCount: 31,
      locationName: 'Dyp Farms Cupping Lab, Mbale',
      address: 'Main Estate, Wanale Ridge',
      city: 'Mbale',
      country: 'Uganda',
      latitude: 1.0818,
      longitude: 34.174,
      pricePerGuest: 45000,
      bookingFee: 3000,
    },
  ];

  for (const tour of tours) {
    await prisma.tour.create({ data: tour });
  }

  const reviews = [
    {
      id: 'rev-1',
      tourId: 'tour-1',
      userName: 'Sarah M.',
      rating: 5,
      comment: 'An incredible experience! The farmers were so welcoming.',
      createdAt: new Date('2026-05-20T12:00:00Z'),
    },
    {
      id: 'rev-2',
      tourId: 'tour-1',
      userName: 'James K.',
      rating: 4,
      comment: 'Great tour, learned a lot about specialty coffee production.',
      createdAt: new Date('2026-05-15T09:30:00Z'),
    },
    {
      id: 'rev-3',
      tourId: 'tour-3',
      userName: 'Elena R.',
      rating: 5,
      comment: 'Best cupping session I have ever attended.',
      createdAt: new Date('2026-05-10T16:00:00Z'),
    },
  ];

  for (const review of reviews) {
    await prisma.review.create({ data: review });
  }

  const slotTemplates: Record<string, { startTime: string; endTime: string; capacity: number }[]> = {
    'tour-1': [
      { startTime: '09:00', endTime: '13:00', capacity: 12 },
      { startTime: '14:00', endTime: '18:00', capacity: 12 },
    ],
    'tour-2': [
      { startTime: '15:00', endTime: '11:00', capacity: 6 },
    ],
    'tour-3': [
      { startTime: '10:00', endTime: '12:00', capacity: 8 },
      { startTime: '15:00', endTime: '17:00', capacity: 8 },
    ],
  };

  const today = new Date();
  for (let day = 1; day <= 14; day++) {
    const slotDate = dateOnly(addDays(today, day));
    for (const [tourId, templates] of Object.entries(slotTemplates)) {
      for (const template of templates) {
        await prisma.tourSlot.create({
          data: {
            tourId,
            date: slotDate,
            startTime: template.startTime,
            endTime: template.endTime,
            capacity: template.capacity,
            bookedGuests: 0,
            status: SlotStatus.open,
          },
        });
      }
    }
  }

  const seedTransactions = [
    {
      userId: 'user-2',
      type: 'deposit' as const,
      provider: 'wallet' as const,
      amount: 500000,
      status: 'completed' as const,
      description: 'Add Funds',
      createdAt: new Date('2026-06-01T10:00:00Z'),
    },
    {
      userId: 'user-2',
      type: 'withdrawal' as const,
      provider: 'wallet' as const,
      amount: -100000,
      status: 'completed' as const,
      description: 'Withdraw to Bank',
      createdAt: new Date('2026-06-02T14:00:00Z'),
    },
    {
      userId: 'user-2',
      type: 'deposit' as const,
      provider: 'system' as const,
      amount: 452075,
      status: 'completed' as const,
      description: 'Opening balance',
      createdAt: new Date('2026-05-01T08:00:00Z'),
    },
  ];

  for (const tx of seedTransactions) {
    await prisma.transaction.create({ data: tx });
  }

  console.log('Seed complete: tours, slots, reviews, transactions');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
