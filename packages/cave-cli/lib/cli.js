'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { URL } = require('url');
let YAML;
try {
  YAML = require(path.join(__dirname, '..', 'node_modules', 'yaml'));
} catch {
  try {
    YAML = require('yaml');
  } catch {
    YAML = null;
  }
}

const { compileTomeModule, validateTomeModuleFile, indexTomeModule } = require('./tome');

const ADAPTER_INDEX = [
  { name: '@inventory/cave-adapter', description: 'Default HTTP Cave transport (TS/Node)', npm: '@inventory/cave-adapter' },
  { name: 'cave-adapter', description: 'Default HTTP Cave transport (Python)', npm: 'cave-adapter' },
];

function usage() {
  console.log(`cave-cli — commands:
  cave init [dir]              — scaffold cave.yaml stub + .env.example
  cave doctor [dir]            — validate cave.yaml / .env keys (no network)
  cave manifest validate <file> — validate cave.manifest.yaml (schema_version cave-manifest/1)
  cave federation aggregate    — fetch static federation slices (--static-only)
  cave adapter list            — list curated adapter packages
  cave adapter add <name>      — print npm/pip install + config snippet
  cave introspect              — print effective env-based registry
  tome validate <module.yaml>  — validate tome.module.yaml v2
  tome compile <module.yaml> [--manifest cave.manifest.yaml]
  tome index <module.yaml> [--out surface.index.json]
`);
}

function initDir(base) {
  const caveYaml = path.join(base, 'cave.yaml');
  const envExample = path.join(base, '.env.example');
  if (!fs.existsSync(caveYaml)) {
    fs.writeFileSync(
      caveYaml,
      `# Cave / SOA registry stub (merge with SOA_REGISTRY_PATH JSON in production)
version: 1
contexts:
  default:
    resaurce: ""
    saurce: ""
    inventory: ""
`,
      'utf8'
    );
  }
  if (!fs.existsSync(envExample)) {
    fs.writeFileSync(
      envExample,
      `# Browser / workers — see packages/cave-contracts README for hybrid 1C discovery
REACT_APP_SOA_RES_AURCE_URL=
REACT_APP_SOA_SAURCE_URL=
REACT_APP_SOA_INVENTORY_URL=
REACT_APP_CAVE_BFF_URL=
SOA_REGISTRY_PATH=
SOA_USE_AWS_DISCOVERY=0
SOA_CLOUDMAP_NAMESPACE_ID=
SOA_CLOUDMAP_SERVICES_JSON={}
SOA_OCP_URL_TEMPLATE=
OCP_NAMESPACE=
`,
      'utf8'
    );
  }
  console.log('init:', caveYaml, envExample);
}

function readYamlOrJson(file) {
  const raw = fs.readFileSync(file, 'utf8');
  if (file.endsWith('.yaml') || file.endsWith('.yml')) {
    if (!YAML) throw new Error('yaml package missing');
    return YAML.parse(raw);
  }
  return JSON.parse(raw);
}

function validateManifest(file) {
  if (!fs.existsSync(file)) {
    console.error('missing manifest', file);
    process.exit(1);
  }
  let doc;
  try {
    doc = readYamlOrJson(file);
  } catch (e) {
    console.error('invalid manifest', e.message);
    process.exit(1);
  }
  const errors = [];
  if (!doc || typeof doc !== 'object') errors.push('root must be object');
  if (doc.schema_version !== 'cave-manifest/1') errors.push('schema_version must be cave-manifest/1');
  if (!doc.service || typeof doc.service !== 'string') errors.push('service required');
  if (doc.messages && typeof doc.messages !== 'object') errors.push('messages must be object');
  if (errors.length) {
    console.error('manifest validate FAILED:', errors.join('; '));
    process.exit(1);
  }
  console.log('manifest validate OK:', file, 'service=', doc.service);
}

function loadRegistry(registryPath) {
  if (!registryPath || !fs.existsSync(registryPath)) return {};
  const doc = readYamlOrJson(registryPath);
  const ctx = doc.contexts?.default || doc.contexts?.[Object.keys(doc.contexts || {})[0]] || doc;
  return ctx;
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const x = new URL(url);
    const lib = x.protocol === 'https:' ? https : http;
    const req = lib.get(url, { headers: { Accept: 'application/json' } }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => req.destroy(new Error('timeout')));
  });
}

function projectFrontendFromManifest(manifest, service) {
  const fe = manifest.tomes?.frontend;
  if (!fe) return null;
  return {
    tome_semver: fe.tome_semver || '0.0.0',
    service,
    surfaces: fe.surfaces || [],
    assets_base: fe.assets_base,
    federation: fe.federation,
  };
}

function parseArgvFlags(argv) {
  const args = new Map();
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token?.startsWith('--')) continue;
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      args.set(token, next);
      i += 1;
    } else {
      args.set(token, true);
    }
  }
  return args;
}

async function federationAggregate(argv) {
  const args = parseArgvFlags(argv);
  const registryPath = args.get('--registry') || process.env.SOA_REGISTRY_PATH;
  const out = args.get('--out') || 'federation.static.aggregated.json';
  const staticOnly = argv.includes('--static-only');
  const services = ['resaurce', 'saurce'];
  const reg = loadRegistry(registryPath);
  const aggregated = {
    schema_version: 'cave-federation-static-aggregated/1',
    generated_at: new Date().toISOString(),
    sources: [],
    services: {},
  };

  for (const svc of services) {
    const base = reg[svc] || process.env[`SOA_${svc.toUpperCase()}_URL`] || process.env[`REACT_APP_SOA_${svc.toUpperCase()}_URL`];
    if (!base) {
      const manifestPath = args.get(`--${svc}-manifest`);
      if (manifestPath && fs.existsSync(manifestPath)) {
        const m = readYamlOrJson(manifestPath);
        const slice = projectFrontendFromManifest(m, svc);
        if (slice) {
          aggregated.services[svc] = slice;
          aggregated.sources.push({ service: svc, url: `file://${manifestPath}`, fetched_at: aggregated.generated_at });
        }
      }
      continue;
    }
    const url = `${String(base).replace(/\/$/, '')}/tome/${svc}-frontend`;
    try {
      const json = staticOnly ? await fetchJson(url) : await fetchJson(url);
      aggregated.services[svc] = json;
      aggregated.sources.push({ service: svc, url, fetched_at: aggregated.generated_at });
    } catch (e) {
      console.warn('skip', svc, e.message);
    }
  }

  fs.writeFileSync(out, JSON.stringify(aggregated, null, 2), 'utf8');
  console.log('federation aggregate wrote', out, Object.keys(aggregated.services).join(', '));
}

function doctor(base) {
  const caveYaml = path.join(base, 'cave.yaml');
  if (!fs.existsSync(caveYaml)) {
    console.error('missing cave.yaml — run cave init');
    process.exit(1);
  }
  try {
    readYamlOrJson(caveYaml);
    console.log('doctor: cave.yaml OK');
  } catch (e) {
    console.error('doctor: invalid cave.yaml', e.message);
    process.exit(1);
  }
}

function redactEnv() {
  const out = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (!k.includes('SOA') && !k.includes('CAVE') && !k.includes('REACT_APP')) continue;
    if (/SECRET|KEY|TOKEN|PASSWORD/i.test(k)) out[k] = '[redacted]';
    else out[k] = v;
  }
  return out;
}

function headCheck(u) {
  return new Promise((resolve) => {
    const x = new URL(u);
    const lib = x.protocol === 'https:' ? https : http;
    const req = lib.request(
      { method: 'HEAD', hostname: x.hostname, port: x.port || (x.protocol === 'https:' ? 443 : 80), path: x.pathname + x.search, timeout: 3000 },
      (res) => resolve({ ok: res.statusCode < 500, status: res.statusCode })
    );
    req.on('error', (e) => resolve({ ok: false, error: e.message }));
    req.end();
  });
}

async function introspect() {
  console.log(JSON.stringify({ env: redactEnv() }, null, 2));
  const bases = [
    process.env.REACT_APP_SOA_RES_AURCE_URL,
    process.env.REACT_APP_SOA_SAURCE_URL,
    process.env.SOA_RES_AURCE_URL,
    process.env.SOA_SAURCE_URL,
  ].filter(Boolean);
  for (const b of bases) {
    if (!/^https?:\/\//i.test(b)) continue;
    const r = await headCheck(b.replace(/\/$/, ''));
    console.log('reachability', b, r);
  }
}

function main(argv) {
  const cmd = argv[0];
  const rest = argv.slice(1);
  if (!cmd || cmd === '-h' || cmd === '--help') {
    usage();
    return;
  }
  const targetDir = rest[0] && !rest[0].startsWith('--') ? path.resolve(process.cwd(), rest[0]) : process.cwd();
  if (cmd === 'init') {
    initDir(targetDir);
    return;
  }
  if (cmd === 'doctor') {
    doctor(targetDir);
    return;
  }
  if (cmd === 'manifest' && rest[0] === 'validate') {
    const file = path.resolve(process.cwd(), rest[1] || 'cave.manifest.yaml');
    validateManifest(file);
    return;
  }
  if (cmd === 'federation' && rest[0] === 'aggregate') {
    federationAggregate(rest.slice(1)).catch((e) => {
      console.error(e);
      process.exit(1);
    });
    return;
  }
  if (cmd === 'adapter' && rest[0] === 'list') {
    console.log(JSON.stringify(ADAPTER_INDEX, null, 2));
    return;
  }
  if (cmd === 'adapter' && rest[0] === 'add') {
    const name = rest[1];
    const row = ADAPTER_INDEX.find((a) => a.name === name);
    if (!row) {
      console.error('unknown adapter', name);
      process.exit(1);
    }
    console.log(`npm install ${row.npm}   # or: pip install -e packages/cave-adapter-py`);
    console.log('Add REACT_APP_SOA_*_URL or SOA_REGISTRY_PATH; see packages/cave-contracts/README.md');
    return;
  }
  if (cmd === 'introspect') {
    introspect().catch((e) => {
      console.error(e);
      process.exit(1);
    });
    return;
  }
  if (cmd === 'tome') {
    const sub = rest[0];
    const flags = parseArgvFlags(rest);
    const positional = rest.filter((t) => !t.startsWith('--'));
    const moduleFile = path.resolve(process.cwd(), positional[1] || 'tome.module.yaml');
    if (sub === 'validate') {
      validateTomeModuleFile(moduleFile, YAML);
      return;
    }
    if (sub === 'compile') {
      const manifestFile = flags.get('--manifest')
        ? path.resolve(process.cwd(), String(flags.get('--manifest')))
        : path.resolve(process.cwd(), 'cave.manifest.yaml');
      compileTomeModule(moduleFile, manifestFile, YAML);
      return;
    }
    if (sub === 'index') {
      const out = flags.get('--out') ? path.resolve(process.cwd(), String(flags.get('--out'))) : undefined;
      indexTomeModule(moduleFile, out, YAML);
      return;
    }
    console.error('unknown tome subcommand', sub);
    process.exit(1);
  }
  usage();
  process.exit(1);
}

module.exports = { main };
