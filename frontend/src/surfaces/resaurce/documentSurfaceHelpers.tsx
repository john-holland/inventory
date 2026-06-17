/**
 * Shared document list UI for resaurce document surfaces.
 */

import React from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { Download as DownloadIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import type { SurfaceViewProps } from '../types';

export type DocRow = {
  id: string;
  name: string;
  description: string;
  status: 'available' | 'generating' | 'ready';
  generatedAt?: string;
};

export function parseDocumentsFromModel(model: SurfaceViewProps['model']): DocRow[] {
  const payload = (model as { payload?: { documents?: unknown[] }; documents?: unknown[] })?.payload;
  const raw = payload?.documents ?? (model as { documents?: unknown[] })?.documents ?? [];
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => {
    const r = row as Record<string, unknown>;
    const st = String(r.status || 'available');
    const status: DocRow['status'] =
      st === 'ready' ? 'ready' : st === 'generating' ? 'generating' : 'available';
    return {
      id: String(r.id ?? `doc_${Math.random()}`),
      name: String(r.name ?? 'Document'),
      description: String(r.description ?? ''),
      status,
      generatedAt: r.generated_at != null ? String(r.generated_at) : undefined,
    };
  });
}

type CategoryCardProps = {
  title: string;
  icon: React.ReactNode;
  documents: DocRow[];
  onGenerate: (doc: DocRow) => void;
  onDownload: (doc: DocRow) => void;
  generatingId?: string | null;
};

export function DocumentCategoryCard({
  title,
  icon,
  documents,
  onGenerate,
  onDownload,
  generatingId,
}: CategoryCardProps) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {icon}
          <Typography variant="h6" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>
        {documents.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No documents listed yet.
          </Typography>
        ) : (
          <List>
            {documents.map((doc) => (
              <ListItem key={doc.id} secondaryAction={
                doc.status === 'ready' ? (
                  <Button size="small" startIcon={<DownloadIcon />} onClick={() => onDownload(doc)}>
                    Download
                  </Button>
                ) : (
                  <Button
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={() => onGenerate(doc)}
                    disabled={generatingId === doc.id}
                  >
                    {generatingId === doc.id ? 'Generating…' : 'Generate'}
                  </Button>
                )
              }>
                <ListItemIcon>{icon}</ListItemIcon>
                <ListItemText primary={doc.name} secondary={doc.description} />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}

/** Parent `idle` (initial). Auto-sends LOAD → `loading`. */
export function makeDocIdleView(label: string) {
  return function DocIdleView({ send }: SurfaceViewProps) {
    React.useEffect(() => {
      send({ type: 'LOAD' });
    }, [send]);
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={24} aria-label={label} />
      </Box>
    );
  };
}

/** Parent `loading`. on_enter → list message. */
export function DocLoadingView() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
      <CircularProgress size={24} />
    </Box>
  );
}

export function DocGeneratingView() {
  return <Alert severity="info">Generating document…</Alert>;
}

export function DocErrorView({ send }: SurfaceViewProps) {
  return (
    <Alert severity="error" action={<Button size="small" onClick={() => send({ type: 'RETRY' })}>Retry</Button>}>
      Document request failed.
    </Alert>
  );
}
