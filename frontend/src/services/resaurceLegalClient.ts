/**
 * Resaurce legal / compliance via RobotCopy.
 */

import { getResaurceRobotCopy } from '../cave/resaurceInventoryCave';
import { isServiceConfigured } from './soaRegistry';
import { MSG_LEGAL_DOCUMENT_REVIEW } from './soaRoutes';

export type LegalReviewResult = Record<string, unknown> & { ok?: boolean; skipped?: boolean };

export async function requestLegalDocumentReview(payload: {
  document_id: string;
  user_id: string;
  context?: string;
}): Promise<LegalReviewResult> {
  if (!isServiceConfigured('resaurce')) {
    return { ok: false, skipped: true, reason: 'REACT_APP_SOA_RES_AURCE_URL unset' };
  }
  const rc = await getResaurceRobotCopy();
  if (!rc) return { ok: false, skipped: true, reason: 'resaurce_cave_shell_unavailable' };
  return rc.sendMessage(
    MSG_LEGAL_DOCUMENT_REVIEW,
    {
      document_id: payload.document_id,
      user_id: payload.user_id,
      context: payload.context ?? '',
    },
    { service: 'resaurce' }
  );
}
