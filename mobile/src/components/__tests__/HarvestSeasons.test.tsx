import { fireEvent, render } from '@testing-library/react-native';
import type { HarvestSeasons as HarvestSeasonsData, OriginSeason } from '../../api/client';
import { HarvestSeasons } from '../HarvestSeasons';

// The icon font loader isn't available under Jest; the icons themselves aren't under test.
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

const strip = (active: number[]) =>
  Array.from({ length: 12 }, (_, i) => ({ month: i + 1, active: active.includes(i + 1) }));

const origin = (o: Partial<OriginSeason> & Pick<OriginSeason, 'country' | 'status'>): OriginSeason => ({
  region: 'Africa',
  coffee: ['Arabica'],
  window: 'Main crop',
  range: 'Oct to Feb',
  monthsAway: 2,
  months: strip([10, 11, 12, 1, 2]),
  ...o,
});

const data: HarvestSeasonsData = {
  asOfMonth: 10,
  asOfMonthName: 'Oct',
  counts: { active: 2, upcoming: 1, total: 4 },
  disclaimer: 'Typical harvest windows.',
  origins: [
    origin({ country: 'Uganda', status: 'active', coffee: ['Robusta', 'Arabica'], monthsAway: 4, note: 'Home note' }),
    origin({ country: 'Kenya', status: 'active', monthsAway: 0, range: 'Oct to Dec' }),
    origin({ country: 'Vietnam', status: 'upcoming', monthsAway: 1, range: 'Nov to Feb' }),
    origin({ country: 'Brazil', status: 'off', monthsAway: 7, range: 'May to Sep' }),
  ],
};

describe('HarvestSeasons', () => {
  it('summarises the month and flags the home origin', () => {
    const { getByText } = render(<HarvestSeasons data={data} />);
    expect(getByText(/Oct: 2 origins harvesting now, 1 starting within two months\./)).toBeTruthy();
    expect(getByText(/^Uganda/)).toBeTruthy();
    expect(getByText(/Home origin/)).toBeTruthy();
    expect(getByText('Home note')).toBeTruthy();
  });

  it('words the timing for active and upcoming windows', () => {
    const { getByText } = render(<HarvestSeasons data={data} />);
    expect(getByText('Main crop ends in 4 months · Oct to Feb')).toBeTruthy();
    expect(getByText('Main crop ends this month · Oct to Dec')).toBeTruthy();
    expect(getByText('Main crop starts in 1 month · Nov to Feb')).toBeTruthy();
  });

  it('keeps off-season origins collapsed until asked', () => {
    const { queryByText, getByText } = render(<HarvestSeasons data={data} />);
    expect(queryByText('Brazil')).toBeNull();
    fireEvent.press(getByText('Off-season (1)'));
    expect(getByText('Brazil')).toBeTruthy();
  });
});
