/** @jest-environment node */
/**
 * Consumer pact: inventory-frontend → resaurce Cave HTTP surface (POST /cave/route).
 * Fresh Pact + dynamic port per test so mock server lifecycle stays consistent.
 */

const fs = require('fs');
const http = require('http');
const { Pact, Matchers } = require('@pact-foundation/pact');
const path = require('path');

function postJson(port, bodyObj) {
  const body = JSON.stringify(bodyObj);
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: '/cave/route',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      },
      (res) => {
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', (c) => {
          raw += c;
        });
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            json: () => JSON.parse(raw || '{}'),
          });
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const pactOpts = {
  consumer: 'inventory-frontend',
  provider: 'resaurce-cave',
  log: path.resolve(process.cwd(), 'logs', 'inventory_resaurce_cave_pact.log'),
  dir: path.resolve(process.cwd(), 'pacts'),
  spec: 2,
  logLevel: 'info',
  pactfileWriteMode: 'merge',
  port: 0,
};

const pactOutFile = path.resolve(process.cwd(), 'pacts', 'inventory-frontend-resaurce-cave.json');

describe('inventory-frontend → resaurce-cave Cave', () => {
  let provider;
  let port;

  beforeAll(() => {
    try {
      fs.unlinkSync(pactOutFile);
    } catch (_) {
      /* no prior file */
    }
  });

  beforeEach(async () => {
    provider = new Pact(pactOpts);
    const opts = await provider.setup();
    port = opts.port;
  });

  afterEach(async () => {
    await provider.verify();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  test('POST /cave/route envelope v2 for HR-style route', async () => {
    await provider.addInteraction({
      state: 'resaurce Cave is healthy',
      uponReceiving: 'a Cave envelope for resaurce HR route',
      withRequest: {
        method: 'POST',
        path: '/cave/route',
        headers: { 'Content-Type': 'application/json' },
        body: {
          schema_version: '2.0',
          route: 'resaurce:hr/help/session',
          payload: { employee_id: Matchers.like('emp-1') },
          trace_id: Matchers.like('trace-1'),
          reply_mode: 'sync_http',
        },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          ok: true,
          service: 'resaurce',
          echoed_route: Matchers.like('resaurce:hr/help/session'),
        },
      },
    });

    const res = await postJson(port, {
      schema_version: '2.0',
      route: 'resaurce:hr/help/session',
      payload: { employee_id: 'emp-1' },
      trace_id: 'trace-1',
      reply_mode: 'sync_http',
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.service).toBe('resaurce');
  });

  test('POST /cave/route envelope v2 for HR help request', async () => {
    await provider.addInteraction({
      state: 'resaurce Cave is healthy',
      uponReceiving: 'a Cave envelope for resaurce HR help request',
      withRequest: {
        method: 'POST',
        path: '/cave/route',
        headers: { 'Content-Type': 'application/json' },
        body: {
          schema_version: '2.0',
          route: 'resaurce:hr/help/request',
          payload: {
            userId: Matchers.like('user-1'),
            context: Matchers.like('doc help'),
            skillsRequired: ['documents'],
            urgency: 'medium',
          },
          trace_id: Matchers.like('trace-hr-1'),
          reply_mode: 'sync_http',
        },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          ok: true,
          hrEmployeeId: Matchers.like('hr_resaurce_001'),
          chatRoomId: Matchers.like('chat_x'),
          sessionId: Matchers.like('hr_session_1'),
          trace_id: Matchers.like('trace-hr-1'),
          context: Matchers.like('doc help'),
        },
      },
    });

    const res = await postJson(port, {
      schema_version: '2.0',
      route: 'resaurce:hr/help/request',
      payload: {
        userId: 'user-1',
        context: 'doc help',
        skillsRequired: ['documents'],
        urgency: 'medium',
      },
      trace_id: 'trace-hr-1',
      reply_mode: 'sync_http',
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.hrEmployeeId).toBeTruthy();
    expect(json.chatRoomId).toBeTruthy();
  });

  test('POST /cave/route envelope v2 for HR employees available', async () => {
    await provider.addInteraction({
      state: 'resaurce Cave is healthy',
      uponReceiving: 'a Cave envelope for resaurce HR employees available',
      withRequest: {
        method: 'POST',
        path: '/cave/route',
        headers: { 'Content-Type': 'application/json' },
        body: {
          schema_version: '2.0',
          route: 'resaurce:hr/employees/available',
          payload: {
            skills_required: ['documents'],
          },
          trace_id: Matchers.like('trace-emp-1'),
          reply_mode: 'sync_http',
        },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          ok: true,
          trace_id: Matchers.like('trace-emp-1'),
          employees: Matchers.eachLike(
            {
              id: Matchers.like('hr_001'),
              name: Matchers.like('Sarah Johnson'),
              email: Matchers.like('a@b.com'),
              skills: ['documents'],
              currentLoad: 2,
              maxLoad: 5,
              rating: 4.8,
            },
            { min: 1 }
          ),
        },
      },
    });

    const res = await postJson(port, {
      schema_version: '2.0',
      route: 'resaurce:hr/employees/available',
      payload: { skills_required: ['documents'] },
      trace_id: 'trace-emp-1',
      reply_mode: 'sync_http',
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(Array.isArray(json.employees)).toBe(true);
  });

  test('POST /cave/route envelope v2 for tax documents list', async () => {
    await provider.addInteraction({
      state: 'resaurce Cave is healthy',
      uponReceiving: 'a Cave envelope for resaurce tax documents list',
      withRequest: {
        method: 'POST',
        path: '/cave/route',
        headers: { 'Content-Type': 'application/json' },
        body: {
          schema_version: '2.0',
          route: 'resaurce:tax/documents/list',
          payload: {},
          trace_id: Matchers.like('trace-tax-list'),
          reply_mode: 'sync_http',
        },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          ok: true,
          trace_id: Matchers.like('trace-tax-list'),
          documents: Matchers.eachLike(
            {
              id: Matchers.like('doc_tax_w2'),
              type: 'tax',
              name: Matchers.like('W2'),
              description: Matchers.like('Annual'),
              status: 'available',
            },
            { min: 1 }
          ),
        },
      },
    });

    const res = await postJson(port, {
      schema_version: '2.0',
      route: 'resaurce:tax/documents/list',
      payload: {},
      trace_id: 'trace-tax-list',
      reply_mode: 'sync_http',
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(Array.isArray(json.documents)).toBe(true);
  });

  test('POST /cave/route envelope v2 message-first (presence_verify)', async () => {
    await provider.addInteraction({
      state: 'resaurce Cave is healthy',
      uponReceiving: 'a message-first Cave envelope for presence_verify',
      withRequest: {
        method: 'POST',
        path: '/cave/route',
        headers: { 'Content-Type': 'application/json' },
        body: {
          schema_version: '2.0',
          message: 'presence_verify',
          service: 'resaurce',
          payload: { token: Matchers.like('tok-1') },
          trace_id: Matchers.like('trace-presence-1'),
          reply_mode: 'sync_http',
        },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          ok: true,
          trace_id: Matchers.like('trace-presence-1'),
        },
      },
    });

    const res = await postJson(port, {
      schema_version: '2.0',
      message: 'presence_verify',
      service: 'resaurce',
      payload: { token: 'tok-1' },
      trace_id: 'trace-presence-1',
      reply_mode: 'sync_http',
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  test('POST /cave/route envelope v2 for tax generate enqueue', async () => {
    await provider.addInteraction({
      state: 'resaurce Cave is healthy',
      uponReceiving: 'a Cave envelope for resaurce tax generate enqueue',
      withRequest: {
        method: 'POST',
        path: '/cave/route',
        headers: { 'Content-Type': 'application/json' },
        body: {
          schema_version: '2.0',
          route: 'resaurce:tax/generate/enqueue',
          payload: {
            user_id: Matchers.like('user-1'),
            year: 2024,
            document_type: Matchers.like('w2'),
            trace_id: Matchers.like('trace-tax-job'),
            session_id: Matchers.like('sess-tax-1'),
          },
          trace_id: Matchers.like('trace-tax-job'),
          reply_mode: 'sync_http',
        },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          ok: true,
          job_id: Matchers.like('job_x'),
          session_id: Matchers.like('sess-tax-1'),
          trace_id: Matchers.like('trace-tax-job'),
          status: 'completed',
          document: {
            user_id: Matchers.like('user-1'),
            year: 2024,
            document_type: Matchers.like('W2'),
          },
        },
      },
    });

    const res = await postJson(port, {
      schema_version: '2.0',
      route: 'resaurce:tax/generate/enqueue',
      payload: {
        user_id: 'user-1',
        year: 2024,
        document_type: 'w2',
        trace_id: 'trace-tax-job',
        session_id: 'sess-tax-1',
      },
      trace_id: 'trace-tax-job',
      reply_mode: 'sync_http',
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.document).toBeTruthy();
  });

  test('POST /cave/route message-first for legal_documents_list', async () => {
    await provider.addInteraction({
      state: 'resaurce Cave is healthy',
      uponReceiving: 'a message-first Cave envelope for legal_documents_list',
      withRequest: {
        method: 'POST',
        path: '/cave/route',
        headers: { 'Content-Type': 'application/json' },
        body: {
          schema_version: '2.0',
          message: 'legal_documents_list',
          service: 'resaurce',
          payload: {},
          trace_id: Matchers.like('trace-legal-list'),
          reply_mode: 'sync_http',
        },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          ok: true,
          service: 'resaurce',
          documents: Matchers.eachLike({ id: Matchers.like('doc_1'), name: Matchers.like('Terms') }),
          trace_id: Matchers.like('trace-legal-list'),
        },
      },
    });

    const res = await postJson(port, {
      schema_version: '2.0',
      message: 'legal_documents_list',
      service: 'resaurce',
      payload: {},
      trace_id: 'trace-legal-list',
      reply_mode: 'sync_http',
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(Array.isArray(json.documents)).toBe(true);
  });

  test('POST /cave/route message-first for inventory_report_list', async () => {
    await provider.addInteraction({
      state: 'resaurce Cave is healthy',
      uponReceiving: 'a message-first Cave envelope for inventory_report_list',
      withRequest: {
        method: 'POST',
        path: '/cave/route',
        headers: { 'Content-Type': 'application/json' },
        body: {
          schema_version: '2.0',
          message: 'inventory_report_list',
          service: 'resaurce',
          payload: {},
          trace_id: Matchers.like('trace-inv-report'),
          reply_mode: 'sync_http',
        },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          ok: true,
          service: 'resaurce',
          documents: Matchers.eachLike({ id: Matchers.like('doc_inv_1'), type: 'inventory' }),
          trace_id: Matchers.like('trace-inv-report'),
        },
      },
    });

    const res = await postJson(port, {
      schema_version: '2.0',
      message: 'inventory_report_list',
      service: 'resaurce',
      payload: {},
      trace_id: 'trace-inv-report',
      reply_mode: 'sync_http',
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(Array.isArray(json.documents)).toBe(true);
  });

  test('POST /cave/route message-first for sales_report_enqueue', async () => {
    await provider.addInteraction({
      state: 'resaurce Cave is healthy',
      uponReceiving: 'a message-first Cave envelope for sales_report_enqueue',
      withRequest: {
        method: 'POST',
        path: '/cave/route',
        headers: { 'Content-Type': 'application/json' },
        body: {
          schema_version: '2.0',
          message: 'sales_report_enqueue',
          service: 'resaurce',
          payload: {
            report_type: Matchers.like('monthly'),
          },
          trace_id: Matchers.like('trace-sales-enq'),
          reply_mode: 'sync_http',
        },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          ok: true,
          service: 'resaurce',
          job_id: Matchers.like('sales_job_1'),
          status: 'completed',
          trace_id: Matchers.like('trace-sales-enq'),
        },
      },
    });

    const res = await postJson(port, {
      schema_version: '2.0',
      message: 'sales_report_enqueue',
      service: 'resaurce',
      payload: { report_type: 'monthly' },
      trace_id: 'trace-sales-enq',
      reply_mode: 'sync_http',
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.job_id).toBeTruthy();
  });
});
