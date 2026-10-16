// Districts used to place demo farms across Uganda.
//
// lat/lng are approximate district centres (town or centroid, good to roughly 10 km).
// They are for realistic-looking test data and map testing, not for surveying.
// Lake-side districts get a small `spreadKm` so generated farms stay on land.

export type Region = 'Central' | 'Western' | 'Eastern' | 'Northern';
export type CoffeeType = 'robusta' | 'arabica';

export interface District {
  name: string;
  region: Region;
  lat: number;
  lng: number;
  /** What the district mostly grows. Mixed districts list both; the first is more common. */
  coffee: CoffeeType[];
  /** Relative share of farmers (coffee heartlands get more). */
  weight: number;
  /** How far from the centre a farm may be placed. */
  spreadKm: number;
  /** Rough growing altitude in metres, used for lot notes. */
  altitude: number;
}

const d = (
  name: string,
  region: Region,
  lat: number,
  lng: number,
  coffee: CoffeeType[],
  weight: number,
  altitude: number,
  spreadKm = 9,
): District => ({ name, region, lat, lng, coffee, weight, spreadKm, altitude });

export const DISTRICTS: District[] = [
  // Central: robusta heartland
  d('Kampala', 'Central', 0.3476, 32.5825, ['robusta'], 1, 1190, 4),
  d('Wakiso', 'Central', 0.4044, 32.4594, ['robusta'], 5, 1200, 8),
  d('Mukono', 'Central', 0.3533, 32.7553, ['robusta'], 8, 1180, 5),
  d('Buikwe', 'Central', 0.3203, 33.0014, ['robusta'], 4, 1150, 4),
  d('Kayunga', 'Central', 0.702, 32.888, ['robusta'], 5, 1100, 8),
  d('Luwero', 'Central', 0.849, 32.473, ['robusta'], 6, 1100, 9),
  d('Nakaseke', 'Central', 0.7167, 32.4333, ['robusta'], 3, 1100, 8),
  d('Mityana', 'Central', 0.4, 32.05, ['robusta'], 5, 1200, 9),
  d('Mubende', 'Central', 0.559, 31.395, ['robusta'], 7, 1300, 10),
  d('Mpigi', 'Central', 0.229, 32.314, ['robusta'], 5, 1200, 8),
  d('Butambala', 'Central', 0.183, 32.1167, ['robusta'], 3, 1150, 6),
  d('Masaka', 'Central', -0.3136, 31.7409, ['robusta'], 9, 1150, 9),
  d('Sembabule', 'Central', -0.0833, 31.4667, ['robusta'], 4, 1250, 9),
  d('Rakai', 'Central', -0.7103, 31.5417, ['robusta'], 5, 1250, 9),
  d('Kyotera', 'Central', -0.6333, 31.5167, ['robusta'], 5, 1200, 8),
  d('Lyantonde', 'Central', -0.4, 31.15, ['robusta'], 2, 1300, 8),
  d('Kiboga', 'Central', 0.9167, 31.7667, ['robusta'], 3, 1100, 9),

  // Western: arabica highlands (Rwenzori, Kisoro/Kabale) and robusta lowlands
  d('Mbarara', 'Western', -0.6072, 30.6545, ['robusta', 'arabica'], 4, 1400, 9),
  d('Isingiro', 'Western', -0.867, 30.833, ['robusta'], 3, 1350, 9),
  d('Ibanda', 'Western', -0.1325, 30.5, ['robusta'], 3, 1400, 9),
  d('Bushenyi', 'Western', -0.544, 30.185, ['arabica', 'robusta'], 5, 1500, 8),
  d('Sheema', 'Western', -0.6, 30.31, ['robusta', 'arabica'], 3, 1450, 7),
  d('Mitooma', 'Western', -0.6167, 30.0167, ['arabica'], 3, 1600, 7),
  d('Rukungiri', 'Western', -0.842, 29.934, ['arabica', 'robusta'], 5, 1400, 9),
  d('Kanungu', 'Western', -0.95, 29.7833, ['arabica', 'robusta'], 4, 1500, 8),
  d('Kabale', 'Western', -1.249, 29.989, ['arabica'], 3, 1900, 7),
  d('Kisoro', 'Western', -1.285, 29.685, ['arabica'], 3, 2000, 6),
  d('Ntungamo', 'Western', -0.881, 30.264, ['robusta', 'arabica'], 4, 1500, 9),
  d('Kasese', 'Western', 0.183, 30.085, ['arabica', 'robusta'], 7, 1500, 10),
  d('Bundibugyo', 'Western', 0.712, 30.064, ['robusta', 'arabica'], 4, 1100, 9),
  d('Kabarole', 'Western', 0.671, 30.275, ['arabica', 'robusta'], 5, 1550, 8),
  d('Kyenjojo', 'Western', 0.627, 30.641, ['robusta'], 4, 1300, 9),
  d('Kamwenge', 'Western', 0.187, 30.454, ['robusta'], 3, 1300, 9),
  d('Kyegegwa', 'Western', 0.4833, 31.05, ['robusta'], 3, 1250, 9),
  d('Kagadi', 'Western', 0.94, 30.81, ['robusta'], 3, 1200, 9),
  d('Hoima', 'Western', 1.433, 31.352, ['robusta'], 3, 1100, 9),
  d('Masindi', 'Western', 1.6744, 31.715, ['robusta'], 2, 1100, 9),

  // Eastern: Mt Elgon arabica (Bugisu) and robusta towards the lake
  d('Mbale', 'Eastern', 1.0821, 34.1751, ['arabica'], 7, 1600, 7),
  d('Sironko', 'Eastern', 1.23, 34.25, ['arabica'], 6, 1700, 6),
  d('Bududa', 'Eastern', 1.003, 34.334, ['arabica'], 4, 1800, 5),
  d('Bulambuli', 'Eastern', 1.1667, 34.3667, ['arabica'], 4, 1750, 6),
  d('Kapchorwa', 'Eastern', 1.396, 34.45, ['arabica'], 4, 1900, 7),
  d('Bukwo', 'Eastern', 1.2833, 34.7333, ['arabica'], 2, 1900, 6),
  d('Tororo', 'Eastern', 0.692, 34.181, ['robusta'], 2, 1150, 8),
  d('Busia', 'Eastern', 0.466, 34.091, ['robusta'], 2, 1150, 4),
  d('Bugiri', 'Eastern', 0.571, 33.741, ['robusta'], 2, 1150, 7),
  d('Mayuge', 'Eastern', 0.458, 33.478, ['robusta'], 2, 1150, 4),
  d('Iganga', 'Eastern', 0.609, 33.4686, ['robusta'], 3, 1100, 8),
  d('Jinja', 'Eastern', 0.4244, 33.2042, ['robusta'], 3, 1150, 5),
  d('Kamuli', 'Eastern', 0.947, 33.12, ['robusta'], 3, 1100, 9),
  d('Kaliro', 'Eastern', 0.897, 33.509, ['robusta'], 1, 1100, 8),
  d('Butaleja', 'Eastern', 0.9167, 33.95, ['robusta'], 1, 1100, 7),
  d('Pallisa', 'Eastern', 1.145, 33.709, ['robusta'], 1, 1100, 8),
  d('Kumi', 'Eastern', 1.459, 33.937, ['robusta'], 1, 1100, 8),
  d('Bukedea', 'Eastern', 1.3167, 34.05, ['robusta'], 1, 1100, 7),
  d('Soroti', 'Eastern', 1.715, 33.611, ['robusta'], 1, 1100, 8),
  d('Serere', 'Eastern', 1.5, 33.55, ['robusta'], 1, 1100, 8),
  d('Katakwi', 'Eastern', 1.896, 33.967, ['robusta'], 1, 1100, 8),

  // Northern: West Nile arabica and a few robusta pockets
  d('Zombo', 'Northern', 2.5167, 30.9, ['arabica'], 5, 1400, 8),
  d('Nebbi', 'Northern', 2.478, 31.089, ['arabica', 'robusta'], 4, 1100, 8),
  d('Arua', 'Northern', 3.02, 30.91, ['arabica'], 4, 1200, 8),
  d('Yumbe', 'Northern', 3.465, 31.247, ['robusta'], 1, 1000, 8),
  d('Koboko', 'Northern', 3.41, 30.96, ['robusta'], 1, 1000, 8),
  d('Moyo', 'Northern', 3.65, 31.717, ['robusta'], 1, 900, 8),
  d('Adjumani', 'Northern', 3.377, 31.79, ['robusta'], 1, 900, 8),
  d('Gulu', 'Northern', 2.7746, 32.299, ['robusta'], 2, 1100, 9),
  d('Amuru', 'Northern', 2.8, 31.9167, ['robusta'], 1, 1000, 9),
  d('Kitgum', 'Northern', 3.278, 32.887, ['robusta'], 1, 950, 9),
  d('Lira', 'Northern', 2.2499, 32.8998, ['robusta'], 2, 1080, 9),
  d('Oyam', 'Northern', 2.2333, 32.3833, ['robusta'], 1, 1080, 9),
  d('Apac', 'Northern', 1.975, 32.539, ['robusta'], 1, 1080, 9),
];

/** Warehouse hubs. A lot is stored at the hub nearest to its farm. */
export const HUBS = [
  { name: 'Kampala Hub', lat: 0.3476, lng: 32.5825 },
  { name: 'Masaka Hub', lat: -0.3136, lng: 31.7409 },
  { name: 'Mbarara Hub', lat: -0.6072, lng: 30.6545 },
  { name: 'Fort Portal Hub', lat: 0.671, lng: 30.275 },
  { name: 'Mbale Hub', lat: 1.0821, lng: 34.1751 },
  { name: 'Jinja Hub', lat: 0.4244, lng: 33.2042 },
  { name: 'Gulu Hub', lat: 2.7746, lng: 32.299 },
  { name: 'Arua Hub', lat: 3.02, lng: 30.91 },
];

/** Rough bounding box of Uganda, used by the data checks. */
export const UGANDA_BOUNDS = { minLat: -1.5, maxLat: 4.25, minLng: 29.55, maxLng: 35.05 };
