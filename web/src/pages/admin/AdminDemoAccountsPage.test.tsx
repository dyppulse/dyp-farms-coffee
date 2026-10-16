import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminDemoAccountsPage } from './AdminDemoAccountsPage';

const farmers = Array.from({ length: 60 }, (_, i) => ({
  email: `farmer${i}@demo.dypfarms.test`,
  password: `FarmerPass${String(i).padStart(2, '0')}`,
  role: 'farmer' as const,
  name: i === 7 ? 'Ada Nakato' : `Farmer ${i}`,
  district: i === 7 ? 'Masaka' : 'Mbale',
}));
const accounts = {
  farmers,
  buyers: [{ email: 'buyer1@demo.dypfarms.test', password: 'BuyerPass0001', role: 'roaster' as const, name: 'Daniel Kintu', district: '' }],
  tourists: [{ email: 'tourist1@demo.dypfarms.test', password: 'TouristPass01', role: 'tourist' as const, name: 'Emma Smith', district: '' }],
  counts: { farmers: 60, buyers: 1, tourists: 1 },
};

vi.mock('../../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/client')>()),
  api: { admin: { demoAccounts: vi.fn() } },
}));
import { api } from '../../api/client';

const writeText = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  vi.mocked(api.admin.demoAccounts).mockResolvedValue(accounts);
  writeText.mockClear();
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});

describe('AdminDemoAccountsPage', () => {
  it('shows one accordion per account type with counts, farmers open first', async () => {
    render(<AdminDemoAccountsPage />);
    await screen.findByRole('button', { name: /Farmers/ });
    expect(screen.getByRole('button', { name: /Farmers/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: /Buyers/ })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: /Tourists/ })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('60')).toBeInTheDocument();
  });

  it('hides passwords until asked, and pages the table', async () => {
    render(<AdminDemoAccountsPage />);
    await screen.findByText('Farmer 0');
    expect(screen.queryByText('FarmerPass00')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('switch', { name: 'Show passwords' }));
    expect(screen.getByText('FarmerPass00')).toBeInTheDocument();
    // 25 per page: row 30 is on page 2
    expect(screen.queryByText('Farmer 30')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /next page/i }));
    expect(screen.getByText('Farmer 30')).toBeInTheDocument();
  });

  it('filters by name, email or district and shows how many match', async () => {
    render(<AdminDemoAccountsPage />);
    await screen.findByText('Farmer 0');
    fireEvent.change(screen.getByLabelText('Search accounts'), { target: { value: 'masaka' } });
    await waitFor(() => expect(screen.getByText('1 of 60')).toBeInTheDocument());
    expect(screen.getByText('Ada Nakato')).toBeInTheDocument();
    expect(screen.queryByText('Farmer 0')).not.toBeInTheDocument();
  });

  it('copies a login (email and password) for one account', async () => {
    render(<AdminDemoAccountsPage />);
    await screen.findByText('Ada Nakato');
    await userEvent.click(screen.getByRole('button', { name: 'Copy login for Ada Nakato' }));
    expect(writeText).toHaveBeenCalledWith('farmer7@demo.dypfarms.test  FarmerPass07');
    expect(await screen.findByText('Login for Ada Nakato copied')).toBeInTheDocument();
  });

  it('opens the buyers accordion and lists buyers without a district column', async () => {
    render(<AdminDemoAccountsPage />);
    await screen.findByText('Farmer 0');
    await userEvent.click(screen.getByRole('button', { name: /Buyers/ }));
    const table = await screen.findByRole('table', { name: 'Buyers (roasters) accounts' });
    expect(within(table).getByText('Daniel Kintu')).toBeInTheDocument();
    expect(within(table).queryByText('District')).not.toBeInTheDocument();
  });

  it('explains how to load the data when the server has none', async () => {
    vi.mocked(api.admin.demoAccounts).mockResolvedValue({ farmers: [], buyers: [], tourists: [], counts: { farmers: 0, buyers: 0, tourists: 0 } });
    render(<AdminDemoAccountsPage />);
    expect(await screen.findByText(/SEED_DEMO_DATA=true/)).toBeInTheDocument();
  });

  it('shows an error with a retry when loading fails', async () => {
    vi.mocked(api.admin.demoAccounts).mockRejectedValueOnce(new Error('Admin access required'));
    render(<AdminDemoAccountsPage />);
    expect(await screen.findByText('Admin access required')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
