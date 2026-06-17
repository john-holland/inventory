/**
 * Cabin Page — cabin_session LVM surface (withState handlers, no switch).
 */

import React from 'react';
import CaveFeatureGate from '../cave/CaveFeatureGate';

export const CabinPage: React.FC = () => (
  <CaveFeatureGate service="saurce" surface="cabin_session" featureLabel="Cabin sessions" />
);

export default CabinPage;
