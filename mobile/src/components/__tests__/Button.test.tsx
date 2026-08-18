import React from 'react';
import { ActivityIndicator } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button Component', () => {
  it('renders with title', () => {
    const { getByText } = render(<Button title="Press me" onPress={() => {}} />);
    expect(getByText('Press me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const mockPress = jest.fn();
    const { getByTestId } = render(
      <Button title="Click" onPress={mockPress} testID="test-button" />
    );

    fireEvent.press(getByTestId('test-button'));
    expect(mockPress).toHaveBeenCalledTimes(1);
  });

  it('disables press when disabled prop is true', () => {
    const mockPress = jest.fn();
    const { getByTestId } = render(
      <Button
        title="Click"
        onPress={mockPress}
        disabled={true}
        testID="test-button"
      />
    );

    fireEvent.press(getByTestId('test-button'));
    expect(mockPress).not.toHaveBeenCalled();
  });

  it('applies variant styles correctly', () => {
    const { getByTestId } = render(
      <Button
        title="Primary"
        variant="primary"
        onPress={() => {}}
        testID="test-button"
      />
    );

    const button = getByTestId('test-button');
    expect(button).toBeTruthy();
  });

  it('displays a spinner instead of the title when loading', () => {
    const { queryByText, UNSAFE_getByType } = render(
      <Button title="Submit" loading={true} onPress={() => {}} />
    );

    // Loading state swaps the title for an ActivityIndicator
    expect(queryByText('Submit')).toBeNull();
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('disables press while loading', () => {
    const mockPress = jest.fn();
    const { getByTestId } = render(
      <Button
        title="Submit"
        onPress={mockPress}
        loading={true}
        testID="test-button"
      />
    );

    fireEvent.press(getByTestId('test-button'));
    expect(mockPress).not.toHaveBeenCalled();
  });
});
