import { caveUnsetMessage } from '../caveShellMessages';

describe('caveUnsetMessage', () => {
  it('returns resaurce env hint', () => {
    expect(caveUnsetMessage('resaurce')).toContain('REACT_APP_SOA_RES_AURCE_URL');
  });

  it('returns saurce env hint', () => {
    expect(caveUnsetMessage('saurce')).toContain('REACT_APP_SOA_SAURCE_URL');
  });
});
