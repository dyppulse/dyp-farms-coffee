/**
 * Typical coffee harvest windows by origin. Months are 1 to 12; a window may wrap the
 * year end (start 10, end 2 = October through February).
 *
 * These are general, approximate calendars, not forecasts: real timing shifts with
 * altitude, region and year, and many origins have a second "fly" or "mitaca" crop.
 * Keep Uganda first; the app treats it as the home origin.
 */
export type CoffeeType = 'Arabica' | 'Robusta';

export interface HarvestWindow {
  label: string;
  startMonth: number;
  endMonth: number;
}

export interface HarvestOrigin {
  country: string;
  region: 'Africa' | 'Asia' | 'Central America' | 'South America';
  coffee: CoffeeType[];
  windows: HarvestWindow[];
  note?: string;
}

export const HARVEST_ORIGINS: HarvestOrigin[] = [
  {
    country: 'Uganda',
    region: 'Africa',
    coffee: ['Robusta', 'Arabica'],
    windows: [
      { label: 'Main crop', startMonth: 10, endMonth: 2 },
      { label: 'Fly crop', startMonth: 4, endMonth: 7 },
    ],
    note: 'Robusta is about 80% of national output; Arabica grows on Mt Elgon and the Rwenzoris.',
  },
  {
    country: 'Kenya',
    region: 'Africa',
    coffee: ['Arabica'],
    windows: [
      { label: 'Main crop', startMonth: 10, endMonth: 12 },
      { label: 'Fly crop', startMonth: 6, endMonth: 8 },
    ],
  },
  {
    country: 'Ethiopia',
    region: 'Africa',
    coffee: ['Arabica'],
    windows: [{ label: 'Main crop', startMonth: 10, endMonth: 1 }],
  },
  {
    country: 'Tanzania',
    region: 'Africa',
    coffee: ['Arabica', 'Robusta'],
    windows: [{ label: 'Main crop', startMonth: 7, endMonth: 12 }],
  },
  {
    country: 'Rwanda',
    region: 'Africa',
    coffee: ['Arabica'],
    windows: [{ label: 'Main crop', startMonth: 3, endMonth: 7 }],
  },
  {
    country: 'Burundi',
    region: 'Africa',
    coffee: ['Arabica'],
    windows: [{ label: 'Main crop', startMonth: 3, endMonth: 7 }],
  },
  {
    country: "Côte d'Ivoire",
    region: 'Africa',
    coffee: ['Robusta'],
    windows: [{ label: 'Main crop', startMonth: 10, endMonth: 3 }],
  },
  {
    country: 'Brazil',
    region: 'South America',
    coffee: ['Arabica', 'Robusta'],
    windows: [{ label: 'Main crop', startMonth: 5, endMonth: 9 }],
    note: 'The world largest producer; harvest peaks in the Southern Hemisphere winter.',
  },
  {
    country: 'Colombia',
    region: 'South America',
    coffee: ['Arabica'],
    windows: [
      { label: 'Main crop', startMonth: 10, endMonth: 12 },
      { label: 'Mitaca crop', startMonth: 4, endMonth: 6 },
    ],
  },
  {
    country: 'Peru',
    region: 'South America',
    coffee: ['Arabica'],
    windows: [{ label: 'Main crop', startMonth: 4, endMonth: 9 }],
  },
  {
    country: 'Guatemala',
    region: 'Central America',
    coffee: ['Arabica'],
    windows: [{ label: 'Main crop', startMonth: 12, endMonth: 4 }],
  },
  {
    country: 'Honduras',
    region: 'Central America',
    coffee: ['Arabica'],
    windows: [{ label: 'Main crop', startMonth: 11, endMonth: 3 }],
  },
  {
    country: 'Costa Rica',
    region: 'Central America',
    coffee: ['Arabica'],
    windows: [{ label: 'Main crop', startMonth: 11, endMonth: 3 }],
  },
  {
    country: 'Nicaragua',
    region: 'Central America',
    coffee: ['Arabica'],
    windows: [{ label: 'Main crop', startMonth: 12, endMonth: 3 }],
  },
  {
    country: 'Mexico',
    region: 'Central America',
    coffee: ['Arabica'],
    windows: [{ label: 'Main crop', startMonth: 11, endMonth: 3 }],
  },
  {
    country: 'Vietnam',
    region: 'Asia',
    coffee: ['Robusta'],
    windows: [{ label: 'Main crop', startMonth: 11, endMonth: 2 }],
    note: 'The largest Robusta producer after Brazil.',
  },
  {
    country: 'Indonesia',
    region: 'Asia',
    coffee: ['Robusta', 'Arabica'],
    windows: [{ label: 'Main crop', startMonth: 4, endMonth: 9 }],
  },
  {
    country: 'India',
    region: 'Asia',
    coffee: ['Arabica', 'Robusta'],
    windows: [{ label: 'Main crop', startMonth: 11, endMonth: 3 }],
  },
  {
    country: 'Papua New Guinea',
    region: 'Asia',
    coffee: ['Arabica'],
    windows: [{ label: 'Main crop', startMonth: 5, endMonth: 9 }],
  },
];
