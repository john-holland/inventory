import React, { useEffect, useMemo, useState } from 'react';
import { Gavel as GavelIcon } from '@mui/icons-material';
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

export const LegalIdleView = makeDocIdleView('legal documents');

export function LegalLoadingView() {
  return <DocLoadingView />;
}

/** Parent `ready`. GENERATE → `generating`. */
export function LegalReadyView({ model, send }: SurfaceViewProps) {
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const documents = useMemo(() => parseDocumentsFromModel(model), [model]);

  const handleGenerate = (doc: DocRow) => {
    setGeneratingId(doc.id);
    send({ type: 'GENERATE', documentId: doc.id, documentType: 'review' });
  };

  useEffect(() => {
    if (generatingId && (model as { lastJobOk?: boolean })?.lastJobOk) {
      setGeneratingId(null);
      send({ type: 'LOAD' });
    }
  }, [model, generatingId, send]);

  return (
    <DocumentCategoryCard
      title="Legal Documents"
      icon={<GavelIcon color="secondary" />}
      documents={documents}
      onGenerate={handleGenerate}
      onDownload={(doc) => alert(`Downloading: ${doc.name}`)}
      generatingId={generatingId}
    />
  );
}

export function LegalGeneratingView() {
  return <DocGeneratingView />;
}

export function LegalErrorView(props: SurfaceViewProps) {
  return <DocErrorView {...props} />;
}

export const legalReviewViews = {
  LegalIdleView,
  LegalLoadingView,
  LegalReadyView,
  LegalGeneratingView,
  LegalErrorView,
};
