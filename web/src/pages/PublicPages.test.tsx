import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { LEGAL_DOCS } from '../legal/content';
import { DeleteAccountInfoPage, LegalPage } from './LegalPage';
import { NotFoundPage } from './NotFoundPage';

describe('public pages', () => {
  it('renders every section of the privacy policy and sets the tab title', () => {
    render(<LegalPage doc="privacy" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeInTheDocument();
    for (const section of LEGAL_DOCS.privacy.sections) {
      expect(screen.getByRole('heading', { name: section.heading })).toBeInTheDocument();
    }
    expect(document.title).toBe('Privacy Policy | Dyp Farms Coffee');
  });

  it('renders the terms', () => {
    render(<LegalPage doc="terms" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Terms of Service' })).toBeInTheDocument();
  });

  it('explains how to delete an account, in the app and by email', () => {
    render(<DeleteAccountInfoPage />);
    expect(screen.getByText(/Profile, then Security, then Delete account/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /@/ })).toHaveAttribute('href', expect.stringContaining('mailto:'));
  });

  it('shows a real 404 with a way home', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go home' })).toHaveAttribute('href', '/');
  });
});
