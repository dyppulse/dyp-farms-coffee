import {
  PrismaClient,
  ProductCategory,
  ShopChannel,
  SlotStatus,
  TourType,
} from '@prisma/client';

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
  await prisma.orderPaymentAttempt.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.shopOrder.deleteMany(); // cascades OrderItem
  await prisma.product.deleteMany();
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

  const slotTemplates: Record<
    string,
    { startTime: string; endTime: string; capacity: number }[]
  > = {
    'tour-1': [
      { startTime: '09:00', endTime: '13:00', capacity: 12 },
      { startTime: '14:00', endTime: '18:00', capacity: 12 },
    ],
    'tour-2': [{ startTime: '15:00', endTime: '11:00', capacity: 6 }],
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

  // Finished-goods ("value addition") catalog — roasted/branded retail product,
  // separate from the raw green-coffee lots traded in the marketplace/auction.
  // channels controls which storefront(s) a product appears on.
  const products = [
    {
      id: 'product-1',
      name: 'Dyp Farms Signature Roast 250g',
      description:
        'Medium-roast Arabica from our Mbale estate, ground to order. Our everyday bag.',
      category: ProductCategory.retail,
      channels: [ShopChannel.tourism, ShopChannel.diaspora, ShopChannel.direct],
      roastLevel: 'Medium',
      weightGrams: 250,
      unit: 'bag',
      priceUgx: 25000,
      minOrderQty: 1,
    },
    {
      id: 'product-2',
      name: 'Wanale Ridge Dark Roast 250g',
      description:
        'Bold, full-bodied dark roast grown on the slopes of Wanale Ridge.',
      category: ProductCategory.retail,
      channels: [ShopChannel.tourism, ShopChannel.diaspora, ShopChannel.direct],
      roastLevel: 'Dark',
      weightGrams: 250,
      unit: 'bag',
      priceUgx: 25000,
      minOrderQty: 1,
    },
    {
      id: 'product-3',
      name: 'Taste of Uganda Gift Box',
      description:
        '3 x 100g single-origin roasts, a cupping card, and a branded mug — presented in a gift box. A popular farm-tour and diaspora take-home item.',
      category: ProductCategory.gift_set,
      channels: [ShopChannel.tourism, ShopChannel.diaspora],
      roastLevel: 'Assorted',
      weightGrams: 300,
      unit: 'box',
      priceUgx: 85000,
      minOrderQty: 1,
    },
    {
      id: 'product-4',
      name: 'Dyp Farms Cold Brew Concentrate 500ml',
      description:
        'Ready-to-pour cold brew concentrate made from our washed Arabica. Farm-tour favorite.',
      category: ProductCategory.retail,
      channels: [ShopChannel.tourism, ShopChannel.direct],
      weightGrams: 500,
      unit: 'bottle',
      priceUgx: 18000,
      minOrderQty: 1,
    },
    {
      id: 'product-5',
      name: 'Signature Roast — Wholesale Case (24 x 250g)',
      description:
        'Wholesale case of our Signature Roast for cafés, hotels, and retailers. Volume pricing included.',
      category: ProductCategory.wholesale,
      channels: [ShopChannel.b2b],
      roastLevel: 'Medium',
      weightGrams: 6000,
      unit: 'case',
      priceUgx: 480000,
      minOrderQty: 1,
    },
    {
      id: 'product-6',
      name: 'Green Bean Sample Box — 1kg (B2B)',
      description:
        'Unroasted green bean sample for roasters evaluating a new lot before committing to a bulk purchase.',
      category: ProductCategory.wholesale,
      channels: [ShopChannel.b2b],
      weightGrams: 1000,
      unit: 'box',
      priceUgx: 35000,
      minOrderQty: 1,
    },
  ];

  for (const product of products) {
    await prisma.product.create({ data: product });
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

  // Farms around Kampala (owner is the in-memory seeded farmer, user-1).
  // Fixed ids + upsert so re-running the seed doesn't duplicate them.
  const seedFarms = [
    {
      id: 'farm-kampala-1',
      name: 'Kololo Hill Coffee Plot',
      sizeHectares: 1.2,
      boundary: [
        { lat: 0.3335, lng: 32.5885 },
        { lat: 0.3335, lng: 32.5905 },
        { lat: 0.3318, lng: 32.5905 },
        { lat: 0.3318, lng: 32.5885 },
      ],
    },
    {
      id: 'farm-kampala-2',
      name: 'Nakawa Urban Estate',
      sizeHectares: 2.5,
      boundary: [
        { lat: 0.3372, lng: 32.6155 },
        { lat: 0.3372, lng: 32.6185 },
        { lat: 0.3345, lng: 32.6185 },
        { lat: 0.3345, lng: 32.6155 },
      ],
    },
    {
      id: 'farm-kampala-3',
      name: 'Makindye Ridge Farm',
      sizeHectares: 3.1,
      boundary: [
        { lat: 0.2825, lng: 32.5875 },
        { lat: 0.2825, lng: 32.5910 },
        { lat: 0.2795, lng: 32.5910 },
        { lat: 0.2795, lng: 32.5875 },
      ],
    },
    {
      id: 'farm-kampala-4',
      name: 'Rubaga Hillside Pin',
      sizeHectares: null,
      boundary: [{ lat: 0.3050, lng: 32.5500 }],
    },
  ];

  for (const farm of seedFarms) {
    await prisma.farm.upsert({
      where: { id: farm.id },
      update: { ...farm, ownerId: 'user-1' },
      create: { ...farm, ownerId: 'user-1' },
    });
  }

  console.log('Seed complete: tours, slots, reviews, products, transactions, farms');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
