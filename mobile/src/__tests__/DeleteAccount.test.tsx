import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import DeleteAccountScreen from '../../app/delete-account';
import { api } from '../api/client';

const mockLogout = jest.fn(async () => {});
const mockSetPendingRole = jest.fn();
const mockDisableBiometrics = jest.fn(async () => {});

jest.mock('expo-router', () => ({ router: { replace: jest.fn(), back: jest.fn() } }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('../hooks/useScreenInsets', () => ({
  useScreenInsets: () => ({ top: 0, bottom: 0, contentBottom: 0 }),
}));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'a@b.com' },
    logout: mockLogout,
    setPendingRole: mockSetPendingRole,
    disableBiometrics: mockDisableBiometrics,
  }),
}));
jest.mock('../api/client', () => ({ api: { account: { delete: jest.fn() } } }));

describe('DeleteAccountScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('does not delete until the user confirms with a password', () => {
    const { getByTestId, queryByTestId } = render(<DeleteAccountScreen />);
    fireEvent.press(getByTestId('start-delete-account'));
    expect(api.account.delete).not.toHaveBeenCalled();
    expect(queryByTestId('confirm-delete-account')).toBeTruthy();
  });

  it('deletes, clears biometrics and signs out on confirmation', async () => {
    (api.account.delete as jest.Mock).mockResolvedValueOnce({ deleted: true });
    const { getByTestId, getByPlaceholderText } = render(<DeleteAccountScreen />);
    fireEvent.press(getByTestId('start-delete-account'));
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'secret-pass');
    fireEvent.press(getByTestId('confirm-delete-account'));
    await waitFor(() => expect(api.account.delete).toHaveBeenCalledWith('secret-pass'));
    await waitFor(() => expect(mockLogout).toHaveBeenCalled());
    expect(mockDisableBiometrics).toHaveBeenCalled();
  });

  it('stays signed in and shows the error when the password is wrong', async () => {
    (api.account.delete as jest.Mock).mockRejectedValueOnce(new Error('Incorrect password'));
    const { getByTestId, getByPlaceholderText } = render(<DeleteAccountScreen />);
    fireEvent.press(getByTestId('start-delete-account'));
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'nope');
    fireEvent.press(getByTestId('confirm-delete-account'));
    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Could not delete account', 'Incorrect password'),
    );
    expect(mockLogout).not.toHaveBeenCalled();
  });
});
