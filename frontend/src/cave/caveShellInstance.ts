/** Browser-safe Cave shell handle (no log-view-machine / Express in the bundle). */
export type CaveShellInstance = {
  start?: () => Promise<void>;
  stop?: () => Promise<void>;
};

export function createStubCaveShellInstance(): CaveShellInstance {
  return {
    start: async () => {},
    stop: async () => {},
  };
}
