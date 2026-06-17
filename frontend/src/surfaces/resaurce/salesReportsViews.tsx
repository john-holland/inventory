import React, { useEffect, useMemo, useState } from 'react';
import { AttachMoney as MoneyIcon } from '@mui/icons-material';
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

export const SalesReportsIdleView = makeDocIdleView('sales reports');

export function SalesReportsLoadingView() {
  return <DocLoadingView />;
}

export function SalesReportsReadyView({ model, send }: SurfaceViewProps) {
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const documents = useMemo(() => parseDocumentsFromModel(model), [model]);

  const handleGenerate = (doc: DocRow) => {
    setGeneratingId(doc.id);
    send({ type: 'GENERATE', reportType: doc.name.includes('Q1') ? 'quarterly' : 'monthly' });
  };

  useEffect(() => {
    if (generatingId && (model as { lastJobOk?: boolean })?.lastJobOk) {
      setGeneratingId(null);
      send({ type: 'LOAD' });
    }
  }, [model, generatingId, send]);

  return (
    <DocumentCategoryCard
      title="Sales Reports"
      icon={<MoneyIcon color="warning" />}
      documents={documents}
      onGenerate={handleGenerate}
      onDownload={(doc) => alert(`Downloading: ${doc.name}`)}
      generatingId={generatingId}
    />
  );
}

export function SalesReportsGeneratingView() {
  return <DocGeneratingView />;
}

export function SalesReportsErrorView(props: SurfaceViewProps) {
  return <DocErrorView {...props} />;
}

export const salesReportsViews = {
  SalesReportsIdleView,
  SalesReportsLoadingView,
  SalesReportsReadyView,
  SalesReportsGeneratingView,
  SalesReportsErrorView,
};
