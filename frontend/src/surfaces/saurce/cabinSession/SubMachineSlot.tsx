/**
 * Sub-machine render slot for wizardActive parent state.
 * Active while parent is `wizardActive`; sub-state follows createWizard (basic → users → airbnb → confirm).
 */
import React from 'react';

type SubMachine = {
  useViewStateMachine: (model: unknown) => { viewStack: React.ReactNode };
};

export function SubMachineSlot({
  subMachine,
  model,
}: {
  subMachine: SubMachine | null | undefined;
  model?: Record<string, unknown>;
}) {
  if (!subMachine) return null;
  return <SubMachineSlotInner subMachine={subMachine} model={model || {}} />;
}

function SubMachineSlotInner({
  subMachine,
  model,
}: {
  subMachine: SubMachine;
  model: Record<string, unknown>;
}) {
  const { viewStack } = subMachine.useViewStateMachine(model);
  return <>{viewStack}</>;
}
