import React from 'react';
import { render, screen } from '@testing-library/react';
import CaveFeatureGate from '../CaveFeatureGate';

jest.mock('../useCaveShell', () => ({
  useCaveShell: jest.fn(),
}));

jest.mock('../../surfaces/registry', () => ({
  getSurfaceRegistry: jest.fn(() => ({
    viewComponents: {},
    messages: {},
  })),
}));

jest.mock('../caveShellMessages', () => ({
  caveUnsetMessage: jest.fn(() => 'Configure REACT_APP_SOA_RES_AURCE_URL'),
}));

import { useCaveShell } from '../useCaveShell';

const mockUseCaveShell = useCaveShell as jest.Mock;

describe('CaveFeatureGate', () => {
  it('shows unset message when shell status is unset', () => {
    mockUseCaveShell.mockReturnValue({
      status: 'unset',
      cave: null,
      error: null,
      retry: jest.fn(),
    });
    render(
      <CaveFeatureGate service="resaurce" surface="tax_documents" featureLabel="Tax documents">
        {() => <div>ready</div>}
      </CaveFeatureGate>
    );
    expect(screen.getByText(/Tax documents:/)).toBeInTheDocument();
    expect(screen.queryByText('ready')).not.toBeInTheDocument();
  });

  it('shows loading placeholder when shell status is loading', () => {
    mockUseCaveShell.mockReturnValue({
      status: 'loading',
      cave: null,
      error: null,
      retry: jest.fn(),
    });
    render(
      <CaveFeatureGate service="resaurce" surface="tax_documents">
        {() => <div>ready</div>}
      </CaveFeatureGate>
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
