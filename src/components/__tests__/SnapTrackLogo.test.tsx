import React from 'react';
import { render } from '@testing-library/react-native';
import { SnapTrackLogo } from '../SnapTrackLogo';

describe('SnapTrackLogo', () => {
  it('renders without crashing', () => {
    const { getByTestId } = render(<SnapTrackLogo />);
    expect(getByTestId('snaptrack-logo')).toBeTruthy();
  });

  it('renders with custom size', () => {
    const { getByTestId } = render(<SnapTrackLogo size={100} />);
    expect(getByTestId('snaptrack-logo')).toBeTruthy();
  });
});