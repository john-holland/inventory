/**
 * Shared Pact v10 consumer harness — dynamic port, merge write mode, verify per test.
 */

const fs = require('fs');
const path = require('path');
const { Pact } = require('@pact-foundation/pact');

/**
 * @param {{ consumer: string, provider: string; logName?: string }} opts
 */
function createPactHarness(opts) {
  const logName = opts.logName || `${opts.consumer}_${opts.provider}`.replace(/\s+/g, '_').toLowerCase();
  const pactFile = path.resolve(
    process.cwd(),
    'pacts',
    `${opts.consumer}-${opts.provider}.json`.replace(/\s+/g, '-').toLowerCase()
  );

  const baseOpts = {
    consumer: opts.consumer,
    provider: opts.provider,
    log: path.resolve(process.cwd(), 'logs', `${logName}.log`),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    logLevel: 'info',
    pactfileWriteMode: 'merge',
    port: 0,
  };

  /** @type {import('@pact-foundation/pact').Pact | null} */
  let provider = null;
  /** @type {number} */
  let port = 0;

  return {
    get port() {
      return port;
    },
    get provider() {
      if (!provider) throw new Error('Pact provider not initialized — call setup() in beforeEach');
      return provider;
    },
    pactFile,
    async setup() {
      provider = new Pact(baseOpts);
      const out = await provider.setup();
      port = out.port;
      return port;
    },
    async verify() {
      if (provider) await provider.verify();
    },
    async finalize() {
      if (provider) await provider.finalize();
      provider = null;
    },
    resetPactFile() {
      try {
        fs.unlinkSync(pactFile);
      } catch (_) {
        /* no prior file */
      }
    },
  };
}

module.exports = { createPactHarness };
