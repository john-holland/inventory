'use strict';

const fs = require('fs');
const path = require('path');

function readDoc(file, YAML) {
  const raw = fs.readFileSync(file, 'utf8');
  if (file.endsWith('.yaml') || file.endsWith('.yml')) {
    if (!YAML) throw new Error('yaml package missing');
    return YAML.parse(raw);
  }
  return JSON.parse(raw);
}

function writeYaml(file, doc, YAML) {
  fs.writeFileSync(file, YAML.stringify(doc), 'utf8');
}

function validateTomeModule(doc) {
  const errors = [];
  if (!doc || typeof doc !== 'object') errors.push('root must be object');
  if (doc.schema_version !== 'tome-module/2') errors.push('schema_version must be tome-module/2');
  if (!doc.service || typeof doc.service !== 'string') errors.push('service required');
  if (!doc.surface || typeof doc.surface !== 'string') errors.push('surface required');
  if (!doc.messages || typeof doc.messages !== 'object') errors.push('messages must be object');
  const flows = doc.robotcopy?.flows;
  if (!flows || typeof flows !== 'object') errors.push('robotcopy.flows required');
  const machines = doc.lvm?.machines;
  if (!Array.isArray(machines) || machines.length === 0) errors.push('lvm.machines required');
  const messageKeys = new Set(Object.keys(doc.messages || {}));
  for (const [flowName, flowDef] of Object.entries(flows || {})) {
    const msg = flowDef?.message || flowName;
    if (!messageKeys.has(msg)) {
      errors.push(`robotcopy flow "${flowName}" references undeclared message "${msg}"`);
    }
  }
  for (const m of machines || []) {
    const states = m.states;
    if (!states || typeof states !== 'object') {
      errors.push(`machine ${m.id || '?'} missing states`);
      continue;
    }
    for (const [stateName, meta] of Object.entries(states)) {
      const onEnterMsg = meta?.on_enter?.message;
      if (onEnterMsg && !messageKeys.has(onEnterMsg)) {
        errors.push(`state ${stateName} on_enter.message "${onEnterMsg}" not in messages`);
      }
    }
  }
  return errors;
}

function buildTomeIndex(doc) {
  const machine = (doc.lvm?.machines || [])[0];
  const states = machine?.states ? Object.keys(machine.states) : [];
  const views = [];
  for (const meta of Object.values(machine?.states || {})) {
    if (meta?.view) views.push(meta.view);
  }
  const subMachines = doc.sub_machines ? Object.keys(doc.sub_machines) : [];
  for (const sm of Object.values(doc.sub_machines || {})) {
    for (const meta of Object.values(sm.states || {})) {
      if (meta?.view) views.push(meta.view);
    }
  }
  return {
    schema_version: 'tome-surface-index/1',
    service: doc.service,
    surface: doc.surface,
    machineId: machine?.id || null,
    initial: machine?.initial || states[0] || 'idle',
    states,
    views,
    messages: Object.keys(doc.messages || {}),
    messages_map: doc.messages || {},
    subMachines,
    sub_machines: doc.sub_machines || {},
    capsule: doc.capsule,
    state_middleware: doc.state_middleware || [],
    views_map: doc.views || {},
    lvm: doc.lvm,
  };
}

function mergeModuleIntoManifest(manifest, moduleDoc) {
  const out = { ...manifest };
  out.messages = { ...(out.messages || {}), ...(moduleDoc.messages || {}) };
  out.robotcopy = out.robotcopy || { flows: {} };
  out.robotcopy.flows = { ...(out.robotcopy.flows || {}), ...(moduleDoc.robotcopy?.flows || {}) };
  if (moduleDoc.cave_robit) {
    out.cave = out.cave || {};
    out.cave.cave_robit = moduleDoc.cave_robit;
  }
  out.lvm = out.lvm || { machines: [] };
  const existingIds = new Set((out.lvm.machines || []).map((m) => m.id));
  for (const m of moduleDoc.lvm?.machines || []) {
    if (!existingIds.has(m.id)) {
      out.lvm.machines.push({
        id: m.id,
        prefixes: m.prefixes || [],
        structural_routes: m.structural_routes || [],
      });
    }
  }
  out.tomes = out.tomes || {};
  out.tomes.frontend = out.tomes.frontend || { surfaces: [] };
  const surfaces = out.tomes.frontend.surfaces || [];
  const hasSurface = surfaces.some((s) => s.id === moduleDoc.surface);
  if (!hasSurface) {
    surfaces.push({ id: moduleDoc.surface, title: moduleDoc.surface.replace(/_/g, ' ') });
  }
  out.tomes.frontend.surfaces = surfaces;
  out.tomes[moduleDoc.surface] = {
    schema_version: 'tome-module/2',
    messages: moduleDoc.messages,
    state_middleware: moduleDoc.state_middleware,
    views: moduleDoc.views,
    lvm: moduleDoc.lvm,
    sub_machines: moduleDoc.sub_machines,
    capsule: moduleDoc.capsule,
  };
  return out;
}

function compileTomeModule(moduleFile, manifestFile, YAML) {
  const moduleDoc = readDoc(moduleFile, YAML);
  const errors = validateTomeModule(moduleDoc);
  if (errors.length) {
    console.error('tome validate FAILED:', errors.join('; '));
    process.exit(1);
  }
  let manifest = { schema_version: 'cave-manifest/1', service: moduleDoc.service };
  if (manifestFile && fs.existsSync(manifestFile)) {
    manifest = readDoc(manifestFile, YAML);
  }
  const merged = mergeModuleIntoManifest(manifest, moduleDoc);
  if (!manifestFile) {
    console.log(JSON.stringify(merged, null, 2));
    return;
  }
  writeYaml(manifestFile, merged, YAML);
  console.log('tome compile OK:', moduleFile, '→', manifestFile);
}

function validateTomeModuleFile(moduleFile, YAML) {
  const moduleDoc = readDoc(moduleFile, YAML);
  const errors = validateTomeModule(moduleDoc);
  if (errors.length) {
    console.error('tome validate FAILED:', errors.join('; '));
    process.exit(1);
  }
  console.log('tome validate OK:', moduleFile, 'surface=', moduleDoc.surface);
}

function indexTomeModule(moduleFile, outFile, YAML) {
  const moduleDoc = readDoc(moduleFile, YAML);
  const errors = validateTomeModule(moduleDoc);
  if (errors.length) {
    console.error('tome index FAILED:', errors.join('; '));
    process.exit(1);
  }
  const index = buildTomeIndex(moduleDoc);
  const dest = outFile || `${moduleDoc.surface}.index.json`;
  fs.writeFileSync(dest, JSON.stringify(index, null, 2), 'utf8');
  console.log('tome index wrote', dest);
}

module.exports = {
  validateTomeModule,
  buildTomeIndex,
  mergeModuleIntoManifest,
  compileTomeModule,
  validateTomeModuleFile,
  indexTomeModule,
};
