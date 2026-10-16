import React from 'react';
import { render } from '@testing-library/react-native';
import { StatusPill } from '../StatusPill';

describe('StatusPill', () => {
  it('shows a capitalised label for a known status', () => {
    const { getByText } = render(<StatusPill status="approved" />);
    expect(getByText('Approved')).toBeTruthy();
  });

  it('exposes the status to screen readers', () => {
    const { getByLabelText } = render(<StatusPill status="pending" />);
    expect(getByLabelText('Status: Pending')).toBeTruthy();
  });

  it('still supports an explicit label and colour', () => {
    const { getByText } = render(<StatusPill label="Open" color="#123456" />);
    expect(getByText('Open')).toBeTruthy();
  });
});
