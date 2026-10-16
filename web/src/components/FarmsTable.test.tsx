import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { FarmWithOwner } from '../api/client';
import { FarmsTable, filterFarms, sortFarms } from './FarmsTable';

vi.mock('./FarmsMap', () => ({ farmCenter: (f: FarmWithOwner) => ({ lat: f.boundary[0].lat, lng: f.boundary[0].lng }) }));

const poly = [
  { lat: 0.3, lng: 32.5 },
  { lat: 0.3, lng: 32.51 },
  { lat: 0.31, lng: 32.51 },
];
const farm = (id: string, name: string, owner: string, size: number | null, created: string, boundary = poly, email = `${owner.split(' ')[0].toLowerCase()}@demo.dypfarms.test`) =>
  ({ id, ownerId: owner, name, sizeHectares: size, boundary, createdAt: created, updatedAt: created, owner: { id: owner, name: owner, email } }) as FarmWithOwner;

const farms = [
  farm('1', 'Nakato Family Coffee Farm (Masaka)', 'Nakato Mutebi', 2.5, '2026-09-01T00:00:00Z'),
  farm('2', 'Wekesa Hillside Plot (Mbale)', 'Wekesa Wanyama', 12, '2026-10-01T00:00:00Z'),
  farm('3', 'Okello Shamba (Gulu)', 'Okello Opio', null, '2026-08-01T00:00:00Z', [{ lat: 2.77, lng: 32.3 }]),
  farm('4', 'Farm 10 (Kasese)', 'Tumusiime Kule', 1, '2026-07-01T00:00:00Z'),
  farm('5', 'Farm 9 (Kasese)', 'Tumusiime Kule', 30, '2026-06-01T00:00:00Z'),
];

describe('filterFarms', () => {
  it('requires every word to match, in any of name, owner, email or size', () => {
    expect(filterFarms(farms, 'masaka nakato', 'all').map((f) => f.id)).toEqual(['1']);
    expect(filterFarms(farms, 'KASESE tumusiime', 'all')).toHaveLength(2);
    expect(filterFarms(farms, 'okello@demo', 'all').map((f) => f.id)).toEqual(['3']);
    expect(filterFarms(farms, '12 ha', 'all').map((f) => f.id)).toEqual(['2']);
    expect(filterFarms(farms, 'nobody', 'all')).toEqual([]);
  });

  it('filters boundary farms and pins', () => {
    expect(filterFarms(farms, '', 'pins').map((f) => f.id)).toEqual(['3']);
    expect(filterFarms(farms, '', 'mapped')).toHaveLength(4);
    expect(filterFarms(farms, 'gulu', 'mapped')).toEqual([]);
  });
});

describe('sortFarms', () => {
  const ids = (rows: FarmWithOwner[]) => rows.map((f) => f.id);

  it('sorts names naturally (Farm 9 before Farm 10)', () => {
    expect(ids(sortFarms(farms, 'name', 'asc')).slice(0, 2)).toEqual(['5', '4']);
  });

  it('sorts by owner, size, boundary points and date, both ways', () => {
    expect(ids(sortFarms(farms, 'owner', 'asc'))[0]).toBe('1');
    expect(ids(sortFarms(farms, 'size', 'desc'))).toEqual(['5', '2', '1', '4', '3']);
    expect(ids(sortFarms(farms, 'points', 'asc'))[0]).toBe('3');
    expect(ids(sortFarms(farms, 'created', 'desc'))).toEqual(['2', '1', '3', '4', '5']);
  });

  it('puts farms without a size last in both directions', () => {
    expect(ids(sortFarms(farms, 'size', 'asc')).at(-1)).toBe('3');
    expect(ids(sortFarms(farms, 'size', 'desc')).at(-1)).toBe('3');
  });

  it('does not change the original list', () => {
    const copy = [...farms];
    sortFarms(farms, 'name', 'desc');
    expect(farms).toEqual(copy);
  });
});

describe('FarmsTable', () => {
  const open = (url = '/admin/farms?view=table') =>
    render(
      <MemoryRouter initialEntries={[url]}>
        <FarmsTable farms={farms} onLocate={() => {}} />
      </MemoryRouter>,
    );
  const names = () => screen.getAllByRole('row').slice(1).map((r) => within(r).queryAllByRole('cell')[0]?.textContent);

  it('starts with the newest farm first', () => {
    open();
    expect(names()[0]).toContain('Wekesa');
  });

  it('sorts when a column header is clicked and flips on a second click', async () => {
    open();
    await userEvent.click(screen.getByRole('button', { name: 'Size' }));
    expect(names()[0]).toContain('Farm 9'); // 30 ha, biggest first
    await userEvent.click(screen.getByRole('button', { name: 'Size' }));
    expect(names()[0]).toContain('Farm 10'); // 1 ha, smallest first
    await userEvent.click(screen.getByRole('button', { name: 'Farm' }));
    expect(names()[0]).toContain('Farm 9'); // text columns start A to Z, natural order
    expect(screen.getByRole('columnheader', { name: /Farm/ })).toHaveAttribute('aria-sort', 'ascending');
  });

  it('reads search, sort and type from the link, so a view can be shared', () => {
    open('/admin/farms?view=table&q=kasese&sort=size&dir=asc&type=mapped');
    expect(screen.getByLabelText('Search farms')).toHaveValue('kasese');
    expect(names()).toEqual([expect.stringContaining('Farm 10'), expect.stringContaining('Farm 9')]);
    expect(screen.getByText('2 of 5 farms')).toBeInTheDocument();
  });

  it('shows counts in the type filter and filters when chosen', async () => {
    open();
    expect(screen.getByRole('button', { name: 'Pin (1)' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Pin (1)' }));
    expect(names()).toEqual([expect.stringContaining('Okello')]);
  });

  it('clears the search and offers to clear filters when nothing matches', async () => {
    open();
    await userEvent.type(screen.getByLabelText('Search farms'), 'zzz');
    expect(await screen.findByText(/No farms match/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(names()).toHaveLength(5);
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });

  it('keeps every keystroke while typing fast, then writes the search to the link', async () => {
    const Where = () => <output data-testid="where">{useLocation().search}</output>;
    render(
      <MemoryRouter initialEntries={['/admin/farms?view=table']}>
        <FarmsTable farms={farms} onLocate={() => {}} />
        <Where />
      </MemoryRouter>,
    );
    await userEvent.type(screen.getByLabelText('Search farms'), 'masaka', { delay: 1 });
    expect(screen.getByLabelText('Search farms')).toHaveValue('masaka');
    expect(names()).toEqual([expect.stringContaining('Nakato')]);
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('q=masaka'), { timeout: 2000 });
  });
});
