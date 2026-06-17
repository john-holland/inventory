declare module 'resaurce_hr/HrChatApp' {
  import type { FC } from 'react';

  export type HrChatAppProps = {
    executeFlow: (
      name: string,
      vars: Record<string, unknown>,
      opts?: { traceId?: string; tenant?: string | null }
    ) => Promise<unknown>;
    userId?: string;
    tenant?: string | null;
  };

  const HrChatApp: FC<HrChatAppProps>;
  export default HrChatApp;
}
