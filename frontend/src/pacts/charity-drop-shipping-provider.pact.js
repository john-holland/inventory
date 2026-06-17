/** @jest-environment node */
/**
 * Provider-side charity tests — local pact file smoke check (no live broker required).
 */

const fs = require('fs');
const path = require('path');

describe('Charity Drop Shipping Provider PACT Tests', () => {
  test('charity consumer pact file exists and has interactions', () => {
    const pactFile = path.resolve(process.cwd(), 'pacts', 'charity-lending-service-drop-shipping-api-bridge.json');
    expect(fs.existsSync(pactFile)).toBe(true);
    const doc = JSON.parse(fs.readFileSync(pactFile, 'utf8'));
    expect(doc.consumer.name).toBe('charity-lending-service');
    expect(doc.provider.name).toBe('drop-shipping-api-bridge');
    expect(Array.isArray(doc.interactions)).toBe(true);
    expect(doc.interactions.length).toBeGreaterThan(0);
  });
});
