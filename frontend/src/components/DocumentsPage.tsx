/**
 * Documents Page — thin shell with CaveFeatureGate grid per document category + HR dialog.
 */

import React, { useState } from 'react';
import { Box, Button, Grid, Typography } from '@mui/material';
import { Help as HelpIcon } from '@mui/icons-material';
import CaveFeatureGate from '../cave/CaveFeatureGate';
import { HrHelpDialog } from '../surfaces/resaurce/hrHelpViews';

const DocumentsPage: React.FC = () => {
  const [hrDialogOpen, setHrDialogOpen] = useState(false);
  const tenantId =
    (typeof process !== 'undefined' && process.env.REACT_APP_SOA_TENANT) || undefined;
  const inventoryUserId =
    (typeof process !== 'undefined' && process.env.REACT_APP_INVENTORY_USER_ID) || 'current_user_id';

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          📄 Documents
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<HelpIcon />}
          onClick={() => setHrDialogOpen(true)}
          size="large"
        >
          Get HR Help
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <CaveFeatureGate service="resaurce" surface="tax_documents" featureLabel="Tax documents" />
        </Grid>
        <Grid item xs={12} md={6}>
          <CaveFeatureGate service="resaurce" surface="legal_review" featureLabel="Legal documents" />
        </Grid>
        <Grid item xs={12} md={6}>
          <CaveFeatureGate service="resaurce" surface="inventory_reports" featureLabel="Inventory reports" />
        </Grid>
        <Grid item xs={12} md={6}>
          <CaveFeatureGate service="resaurce" surface="sales_reports" featureLabel="Sales reports" />
        </Grid>
      </Grid>

      <HrHelpDialog
        open={hrDialogOpen}
        onClose={() => setHrDialogOpen(false)}
        tenantId={tenantId}
        userId={inventoryUserId}
      />
    </Box>
  );
};

export default DocumentsPage;
