#!/usr/bin/env node
import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.join(__dirname, '..');

await esbuild.build({
  entryPoints: [path.join(pkgRoot, 'src/index.js')],
  bundle: true,
  format: 'esm',
  outfile: path.join(pkgRoot, 'dist/index.js'),
  platform: 'browser',
  target: 'es2020',
  sourcemap: true,
  jsx: 'automatic',
  loader: { '.json': 'json' },
  external: ['react', 'react-dom', 'react/jsx-runtime', 'log-view-machine/browser'],
});

console.log('Built dist/index.js');
