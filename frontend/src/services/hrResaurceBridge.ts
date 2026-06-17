/**
 * HR help session allocation via resaurce Cave RobotCopy only.
 */

import { getResaurceRobotCopy } from '../cave/resaurceInventoryCave';
import type { HelpRequest, HRHelpSession } from './HRHelpService';
import { MSG_REQUEST_HR_HELP } from './soaRoutes';

export type HrCaveAttempt =
  | { kind: 'session'; session: HRHelpSession; raw: Record<string, unknown> }
  | { kind: 'skipped'; raw: Record<string, unknown> }
  | { kind: 'failed'; raw: Record<string, unknown> };

export async function createHrHelpSessionFromResaurceCave(
  helpRequest: HelpRequest,
  options: { presence: string | null }
): Promise<HrCaveAttempt> {
  const rc = await getResaurceRobotCopy();
  if (!rc) {
    return { kind: 'skipped', raw: { reason: 'resaurce_cave_shell_unavailable' } };
  }
  const raw = (await rc.sendMessage(
    MSG_REQUEST_HR_HELP,
    {
      userId: helpRequest.userId,
      context: helpRequest.context,
      skillsRequired: helpRequest.skillsRequired,
      urgency: helpRequest.urgency,
    },
    { presence: options.presence ?? undefined, service: 'resaurce', requiresPresence: true }
  )) as Record<string, unknown> & { ok?: boolean; skipped?: boolean };

  if (raw.skipped) {
    return { kind: 'skipped', raw };
  }
  if (raw.ok && raw.hrEmployeeId && raw.chatRoomId) {
    const session: HRHelpSession = {
      id: (raw.sessionId as string) || `hr_session_${Date.now()}`,
      requesterId: helpRequest.userId,
      hrEmployeeId: raw.hrEmployeeId as string,
      chatRoomId: raw.chatRoomId as string,
      context: helpRequest.context,
      startTime: new Date().toISOString(),
      status: 'active',
    };
    return { kind: 'session', session, raw };
  }
  return { kind: 'failed', raw };
}
