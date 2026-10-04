// Demo farms around Kampala (owned by the in-memory seeded farmer, user-1).
// Shared by the full dev seed (seed.ts) and the insert-only seed-farms.ts.
export const OWNER_ID = 'user-1';

export const seedFarms = [
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
      { lat: 0.2825, lng: 32.591 },
      { lat: 0.2795, lng: 32.591 },
      { lat: 0.2795, lng: 32.5875 },
    ],
  },
  {
    id: 'farm-kampala-4',
    name: 'Rubaga Hillside Pin',
    sizeHectares: null,
    boundary: [{ lat: 0.305, lng: 32.55 }],
  },
];
