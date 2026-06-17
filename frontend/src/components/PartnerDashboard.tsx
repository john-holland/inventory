/**
 * Partner Dashboard — commerce_wallet LVM surface (withState handlers, no switch).
 */

import React from 'react';
import CaveFeatureGate from '../cave/CaveFeatureGate';

export const PartnerDashboard: React.FC = () => (
  <CaveFeatureGate service="saurce" surface="commerce_wallet" featureLabel="Partner wallets" />
);

export default PartnerDashboard;
