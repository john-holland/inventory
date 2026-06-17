/**
 * CSR Dashboard — review_cabin LVM surface (withState handlers, no switch).
 */

import React from 'react';
import CaveFeatureGate from '../cave/CaveFeatureGate';

export const CSRDashboard: React.FC = () => (
  <CaveFeatureGate service="saurce" surface="review_cabin" featureLabel="Review cabin" />
);

export default CSRDashboard;
