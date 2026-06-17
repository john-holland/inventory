module.exports = {
  useTomeSurface: () => ({ machine: null, error: null }),
  TomeSurfaceView: () => null,
  getPresenceStore: () => ({ readSync: () => null }),
  getServiceCaveDb: () => ({ tomeId: 'saurce-inventory-ui' }),
  serviceCaveDbTomeId: (s) => `${s}-inventory-ui`,
  createBrowserCaveDb: () => ({}),
  loadTomeSurfaceIndex: async () => null,
  buildSurfaceMachine: () => ({}),
  buildSurfaceMachineWithSubMachines: () => ({}),
};
