import React, { useEffect, useMemo, useState } from 'react';
import { Description as DescriptionIcon } from '@mui/icons-material';
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

/** Parent `idle` (initial). Auto-sends LOAD → `loading`. */
export const TaxIdleView = makeDocIdleView('tax documents');

/** Parent `loading`. on_enter → tax_documents_list. */
export function TaxLoadingView() {
  return <DocLoadingView />;
}

/** Parent `ready`. Incoming: `loading` (DATA_OK). Lists tax docs; GENERATE → `generating`. */
export function TaxReadyView({ model, send }: SurfaceViewProps) {
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const documents = useMemo(() => parseDocumentsFromModel(model), [model]);

  const inferDocumentType = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('1099')) return '1099-C';
    if (n.includes('investment')) return 'investment_gains_losses';
    return 'w2';
  };

  const handleGenerate = (doc: DocRow) => {
    setGeneratingId(doc.id);
    send({
      type: 'GENERATE',
      documentType: inferDocumentType(doc.name),
      documentId: doc.id,
      userId:
        (typeof process !== 'undefined' && process.env.REACT_APP_INVENTORY_USER_ID) || 'current_user_id',
    });
  };

  useEffect(() => {
    if (generatingId && (model as { lastJobOk?: boolean })?.lastJobOk) {
      setGeneratingId(null);
      send({ type: 'LOAD' });
    }
  }, [model, generatingId, send]);

  return (
    <DocumentCategoryCard
      title="Tax Documents"
      icon={<DescriptionIcon color="primary" />}
      documents={documents}
      onGenerate={handleGenerate}
      onDownload={(doc) => alert(`Downloading: ${doc.name}`)}
      generatingId={generatingId}
    />
  );
}

/** Parent `generating`. on_enter → tax_generate_enqueue. Outgoing: DATA_OK → `ready`. */
export function TaxGeneratingView() {
  return <DocGeneratingView />;
}

export function TaxErrorView(props: SurfaceViewProps) {
  return <DocErrorView {...props} />;
}

export const taxDocumentsViews = {
  TaxIdleView,
  TaxLoadingView,
  TaxReadyView,
  TaxGeneratingView,
  TaxErrorView,
};
