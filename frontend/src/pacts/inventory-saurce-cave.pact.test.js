/** @jest-environment node */
/**
 * Consumer pact: inventory-frontend → saurce Cave HTTP surface (POST /cave/route).
 */

const fs = require('fs');
const { Matchers } = require('@pact-foundation/pact');
const path = require('path');
const { postJson } = require('./pactHttp');
const { createPactHarness } = require('./pactTestHarness');

const harness = createPactHarness({
  consumer: 'inventory-frontend',
  provider: 'saurce-cave',
  logName: 'inventory_saurce_cave_pact',
});

describe('inventory-frontend → saurce-cave Cave', () => {
  beforeAll(() => {
    harness.resetPactFile();
  });

  beforeEach(async () => {
    await harness.setup();
  });

  afterEach(async () => {
    await harness.verify();
  });

  afterAll(async () => {
    await harness.finalize();
  });

  test('POST /cave/route envelope v2 for wallet route', async () => {
    await harness.provider.addInteraction({
      state: 'saurce Cave is healthy',
      uponReceiving: 'a Cave envelope for saurce wallet route',
      withRequest: {
        method: 'POST',
        path: '/cave/route',
        headers: { 'Content-Type': 'application/json' },
        body: {
          schema_version: '2.0',
          route: 'saurce:wallet/balance',
          payload: { user_id: Matchers.like('u1') },
          trace_id: Matchers.like('trace-wallet'),
          reply_mode: 'sync_http',
        },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          ok: true,
          service: 'saurce',
          echoed_route: Matchers.like('saurce:wallet/balance'),
        },
      },
    });

    const res = await postJson(harness.port, '/cave/route', {
      schema_version: '2.0',
      route: 'saurce:wallet/balance',
      payload: { user_id: 'u1' },
      trace_id: 'trace-wallet',
      reply_mode: 'sync_http',
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.service).toBe('saurce');
  });

  test('POST /cave/route envelope v2 for investment eligibility', async () => {
    await harness.provider.addInteraction({
      state: 'saurce Cave is healthy',
      uponReceiving: 'investment eligibility evaluate',
      withRequest: {
        method: 'POST',
        path: '/cave/route',
        headers: { 'Content-Type': 'application/json' },
        body: {
          schema_version: '2.0',
          route: 'saurce:investment/eligibility/evaluate',
          payload: {
            item_id: Matchers.like('item_1'),
            hold_type: Matchers.like('additional'),
            shipping_item_status: Matchers.like(''),
          },
          trace_id: Matchers.like('trace-inv'),
          reply_mode: 'sync_http',
        },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          ok: true,
          service: 'saurce',
          is_eligible: true,
          hold_type: Matchers.like('additional'),
        },
      },
    });

    const res = await postJson(harness.port, '/cave/route', {
      schema_version: '2.0',
      route: 'saurce:investment/eligibility/evaluate',
      payload: { item_id: 'item_1', hold_type: 'additional', shipping_item_status: '' },
      trace_id: 'trace-inv',
      reply_mode: 'sync_http',
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.is_eligible).toBe(true);
  });

  test('POST /cave/route message-first for review_queue_list', async () => {
    await harness.provider.addInteraction({
      state: 'saurce Cave is healthy',
      uponReceiving: 'a message-first Cave envelope for review_queue_list',
      withRequest: {
        method: 'POST',
        path: '/cave/route',
        headers: { 'Content-Type': 'application/json' },
        body: {
          schema_version: '2.0',
          message: 'review_queue_list',
          service: 'saurce',
          payload: {},
          trace_id: Matchers.like('trace-review-queue'),
          reply_mode: 'sync_http',
        },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          ok: true,
          service: 'saurce',
          queue: [],
          trace_id: Matchers.like('trace-review-queue'),
        },
      },
    });

    const res = await postJson(harness.port, '/cave/route', {
      schema_version: '2.0',
      message: 'review_queue_list',
      service: 'saurce',
      payload: {},
      trace_id: 'trace-review-queue',
      reply_mode: 'sync_http',
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(Array.isArray(json.queue)).toBe(true);
  });

  test('POST /cave/route message-first for review_cabin_submit', async () => {
    await harness.provider.addInteraction({
      state: 'saurce Cave is healthy',
      uponReceiving: 'a message-first Cave envelope for review_cabin_submit',
      withRequest: {
        method: 'POST',
        path: '/cave/route',
        headers: { 'Content-Type': 'application/json' },
        body: {
          schema_version: '2.0',
          message: 'review_cabin_submit',
          service: 'saurce',
          payload: {
            cabin_id: Matchers.like('cabin_1'),
            reviewer_id: Matchers.like('user_1'),
            reviewer_name: Matchers.like('Jane'),
            rating: Matchers.like(5),
            title: Matchers.like('Great demo'),
            content: Matchers.like('Loved the session'),
          },
          trace_id: Matchers.like('trace-review-submit'),
          reply_mode: 'sync_http',
        },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          ok: true,
          service: 'saurce',
          review: {
            id: Matchers.like('review_1'),
            cabinId: Matchers.like('cabin_1'),
            rating: Matchers.like(5),
            title: Matchers.like('Great demo'),
            status: Matchers.like('pending'),
          },
          trace_id: Matchers.like('trace-review-submit'),
        },
      },
    });

    const res = await postJson(harness.port, '/cave/route', {
      schema_version: '2.0',
      message: 'review_cabin_submit',
      service: 'saurce',
      payload: {
        cabin_id: 'cabin_1',
        reviewer_id: 'user_1',
        reviewer_name: 'Jane',
        rating: 5,
        title: 'Great demo',
        content: 'Loved the session',
      },
      trace_id: 'trace-review-submit',
      reply_mode: 'sync_http',
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.review).toBeTruthy();
  });

  test('POST /cave/route message-first for review_ticket_create', async () => {
    await harness.provider.addInteraction({
      state: 'saurce Cave is healthy',
      uponReceiving: 'a message-first Cave envelope for review_ticket_create',
      withRequest: {
        method: 'POST',
        path: '/cave/route',
        headers: { 'Content-Type': 'application/json' },
        body: {
          schema_version: '2.0',
          message: 'review_ticket_create',
          service: 'saurce',
          payload: {
            cabin_id: Matchers.like('cabin_1'),
            reason: Matchers.like('Needs CSR follow-up'),
            priority: Matchers.like('high'),
          },
          trace_id: Matchers.like('trace-ticket'),
          reply_mode: 'sync_http',
        },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          ok: true,
          service: 'saurce',
          ticket: {
            id: Matchers.like('ticket_1'),
            cabinId: Matchers.like('cabin_1'),
            priority: Matchers.like('high'),
            status: Matchers.like('open'),
            reason: Matchers.like('Needs CSR follow-up'),
          },
          queue_item: {
            ticketId: Matchers.like('ticket_1'),
            priority: Matchers.like(3),
            category: Matchers.like('general'),
            severity: Matchers.like('medium'),
          },
          trace_id: Matchers.like('trace-ticket'),
        },
      },
    });

    const res = await postJson(harness.port, '/cave/route', {
      schema_version: '2.0',
      message: 'review_ticket_create',
      service: 'saurce',
      payload: {
        cabin_id: 'cabin_1',
        reason: 'Needs CSR follow-up',
        priority: 'high',
      },
      trace_id: 'trace-ticket',
      reply_mode: 'sync_http',
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.ticket).toBeTruthy();
  });

  test('POST /cave/route message-first for wallet_list', async () => {
    await harness.provider.addInteraction({
      state: 'saurce Cave is healthy',
      uponReceiving: 'a message-first Cave envelope for wallet_list',
      withRequest: {
        method: 'POST',
        path: '/cave/route',
        headers: { 'Content-Type': 'application/json' },
        body: {
          schema_version: '2.0',
          message: 'wallet_list',
          service: 'saurce',
          payload: {},
          trace_id: Matchers.like('trace-wallet-list'),
          reply_mode: 'sync_http',
        },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          ok: true,
          service: 'saurce',
          wallets: Matchers.eachLike({ id: Matchers.like('wallet_1'), balance: Matchers.like(100) }),
          trace_id: Matchers.like('trace-wallet-list'),
        },
      },
    });

    const res = await postJson(harness.port, '/cave/route', {
      schema_version: '2.0',
      message: 'wallet_list',
      service: 'saurce',
      payload: {},
      trace_id: 'trace-wallet-list',
      reply_mode: 'sync_http',
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(Array.isArray(json.wallets)).toBe(true);
  });

  test('POST /cave/route message-first for investment_mode_enable', async () => {
    await harness.provider.addInteraction({
      state: 'saurce Cave is healthy',
      uponReceiving: 'a message-first Cave envelope for investment_mode_enable',
      withRequest: {
        method: 'POST',
        path: '/cave/route',
        headers: { 'Content-Type': 'application/json' },
        body: {
          schema_version: '2.0',
          message: 'investment_mode_enable',
          service: 'saurce',
          payload: {
            item_id: Matchers.like('item_1'),
          },
          trace_id: Matchers.like('trace-inv-mode'),
          reply_mode: 'sync_http',
        },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          ok: true,
          service: 'saurce',
          risky_mode_enabled: true,
          item_id: Matchers.like('item_1'),
        },
      },
    });

    const res = await postJson(harness.port, '/cave/route', {
      schema_version: '2.0',
      message: 'investment_mode_enable',
      service: 'saurce',
      payload: { item_id: 'item_1' },
      trace_id: 'trace-inv-mode',
      reply_mode: 'sync_http',
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.risky_mode_enabled).toBe(true);
  });
});
