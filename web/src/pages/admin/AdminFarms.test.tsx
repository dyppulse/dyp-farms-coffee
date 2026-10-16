import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminFarmsMapPage } from './AdminFarmsMapPage';
import { AdminOverviewPage } from './AdminOverviewPage';

const farms = Array.from({ length: 60 }, (_, i) => ({
  id: `f${i}`,
  ownerId: 'o1',
  name: `Farm ${String(i).padStart(2, '0')}`,
  sizeHectares: i + 1,
  boundary: [
    { lat: 0.3 + i * 0.001, lng: 32.5 },
    { lat: 0.3 + i * 0.001, lng: 32.501 },
    { lat: 0.301 + i * 0.001, lng: 32.501 },
  ],
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
  owner: { id: 'o1', name: 'Owner One', email: 'one@demo.dypfarms.test' },
}));

vi.mock('../../components/FarmsMap', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../components/FarmsMap')>()),
  FarmsMap: () => <div data-testid="farms-map" />,
}));
vi.mock('../../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/client')>()),
  api: {
    admin: {
      farms: vi.fn(),
      stats: vi.fn(),
      tickets: vi.fn(),
    },
  },
}));
import { api } from '../../api/client';

beforeEach(() => {
  vi.mocked(api.admin.farms).mockResolvedValue(farms as never);
  vi.mocked(api.admin.stats).mockResolvedValue({ totalLots: 1, totalVolumeKg: 1, activeAuctions: 1, totalFarms: 60, openTickets: 0 } as never);
  vi.mocked(api.admin.tickets).mockResolvedValue([] as never);
});

describe('admin overview farms table', () => {
  it('shows a short preview with a See more link to the full table', async () => {
    render(
      <MemoryRouter>
        <AdminOverviewPage />
      </MemoryRouter>,
    );
    await screen.findByText('Showing 8 of 60 farms');
    const rows = screen.getAllByRole('row').filter((r) => within(r).queryByText(/^Farm \d\d$/));
    expect(rows).toHaveLength(8);
    expect(screen.getByRole('link', { name: 'See more' })).toHaveAttribute('href', '/admin/farms?view=table');
  });

  it('shows no See more link when there are only a few farms', async () => {
    vi.mocked(api.admin.farms).mockResolvedValue(farms.slice(0, 5) as never);
    render(
      <MemoryRouter>
        <AdminOverviewPage />
      </MemoryRouter>,
    );
    await screen.findByText('Largest farms');
    expect(screen.getAllByText('Farm 04').length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: 'See more' })).not.toBeInTheDocument();
  });
});

describe('admin farms page', () => {
  const open = (url: string) =>
    render(
      <MemoryRouter initialEntries={[url]}>
        <AdminFarmsMapPage />
      </MemoryRouter>,
    );

  it('opens on the map by default', async () => {
    open('/admin/farms');
    expect(await screen.findByTestId('farms-map')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Map/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('opens with the table selected when the link says view=table', async () => {
    open('/admin/farms?view=table');
    expect(await screen.findByText('Farm 00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Table/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByTestId('farms-map')).not.toBeInTheDocument();
  });

  it('pages the table 25 at a time and can search', async () => {
    open('/admin/farms?view=table');
    await screen.findByText('Farm 00');
    expect(screen.queryByText('Farm 30')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /next page/i }));
    expect(await screen.findByText('Farm 30')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Search farms'), 'Farm 59');
    expect(await screen.findByText('Farm 59')).toBeInTheDocument();
    expect(screen.queryByText('Farm 30')).not.toBeInTheDocument();
  });

  it('switching to the map from the table works', async () => {
    open('/admin/farms?view=table');
    await screen.findByText('Farm 00');
    await userEvent.click(screen.getByRole('button', { name: /Map/ }));
    expect(await screen.findByTestId('farms-map')).toBeInTheDocument();
  });
});
