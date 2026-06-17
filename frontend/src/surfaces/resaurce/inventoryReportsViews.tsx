import React, { useEffect, useMemo, useState } from 'react';
import { Inventory as InventoryIcon } from '@mui/icons-material';
import type { SurfaceViewProps } from '../types';
import {
  DocumentCategoryCard,
  DocErrorView,
  DocGeneratingView,
  DocLoadingView,
  makeDocIdleView,
  parseDocumentsFromModel,
  type DocRow,
} from './documentSurfaceHelpers';

export const InventoryReportsIdleView = makeDocIdleView('inventory reports');

export function InventoryReportsLoadingView() {
  return <DocLoadingView />;
}

export function InventoryReportsReadyView({ model, send }: SurfaceViewProps) {
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const documents = useMemo(() => parseDocumentsFromModel(model), [model]);

  const handleGenerate = (doc: DocRow) => {
    setGeneratingId(doc.id);
    send({ type: 'GENERATE', reportType: doc.name.includes('Q1') ? 'quarterly' : 'valuation' });
  };

  useEffect(() => {
    if (generatingId && (model as { lastJobOk?: boolean })?.lastJobOk) {
      setGeneratingId(null);
      send({ type: 'LOAD' });
    }
  }, [model, generatingId, send]);

  return (
    <DocumentCategoryCard
      title="Inventory Reports"
      icon={<InventoryIcon color="success" />}
      documents={documents}
      onGenerate={handleGenerate}
      onDownload={(doc) => alert(`Downloading: ${doc.name}`)}
      generatingId={generatingId}
    />
  );
}

export function InventoryReportsGeneratingView() {
  return <DocGeneratingView />;
}

export function InventoryReportsErrorView(props: SurfaceViewProps) {
  return <DocErrorView {...props} />;
}

export const inventoryReportsViews = {
  InventoryReportsIdleView,
  InventoryReportsLoadingView,
  InventoryReportsReadyView,
  InventoryReportsGeneratingView,
  InventoryReportsErrorView,
};
