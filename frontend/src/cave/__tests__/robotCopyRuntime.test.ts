import { mergePayloadTemplate, createRobotCopyRuntime } from '../robotCopyRuntime';
import type { ResaurceFrontendTome } from '../../services/resaurceUiTome';

describe('robotCopyRuntime', () => {
  test('mergePayloadTemplate substitutes placeholders', () => {
    expect(
      mergePayloadTemplate(
        { userId: '{{userId}}', context: 'static', skillsRequired: '{{skills}}' },
        { userId: 'u1', skills: ['a', 'b'] }
      )
    ).toEqual({ userId: 'u1', context: 'static', skillsRequired: ['a', 'b'] });
  });

  test('createRobotCopyRuntime sends message-first flows', async () => {
    const tome = {
      tome_semver: '1.0.0',
      service: 'resaurce',
      surfaces: [],
    } as ResaurceFrontendTome;
    const sent: string[] = [];
    const rt = createRobotCopyRuntime(
      {
        ...tome,
        robotcopy: {
          flows: {
            request_hr_help: {
              message: 'request_hr_help',
              payload_template: { userId: '{{userId}}' },
              requires_presence: true,
            },
          },
        },
      } as ResaurceFrontendTome & { robotcopy: { flows: Record<string, unknown> } },
      {
        sendCaveRoute: async () => ({ ok: true }),
        sendCaveMessage: async (msg) => {
          sent.push(msg);
          return { ok: true };
        },
        verifyPresence: async () => ({ ok: true }),
        readPresence: () => 't',
      }
    );
    const res = await rt.executeFlow('request_hr_help', { userId: 'u1' });
    expect(res.ok).toBe(true);
    expect(sent).toEqual(['request_hr_help']);
  });

  test('createRobotCopyRuntime uses manifest-injected flows from deps', async () => {
    const tome = {
      tome_semver: '1.0.0',
      service: 'resaurce',
      surfaces: [],
    } as ResaurceFrontendTome;
    const sent: string[] = [];
    const rt = createRobotCopyRuntime(tome, {
      sendCaveRoute: async () => ({ ok: true }),
      sendCaveMessage: async (msg) => {
        sent.push(msg);
        return { ok: true };
      },
      verifyPresence: async () => ({ ok: true }),
      readPresence: () => 't',
      flows: {
        tax_documents_list: { message: 'tax_documents_list', payload_template: {} },
      },
    });
    const res = await rt.executeFlow('tax_documents_list', {});
    expect(res.ok).toBe(true);
    expect(sent).toEqual(['tax_documents_list']);
  });

  test('createRobotCopyRuntime rejects unknown flows', async () => {
    const tome = {
      tome_semver: '1.0.0',
      service: 'resaurce',
      surfaces: [],
    } as ResaurceFrontendTome;
    const rt = createRobotCopyRuntime(tome, {
      sendCaveRoute: async () => ({ ok: true }),
      sendCaveMessage: async () => ({ ok: true }),
      verifyPresence: async () => ({ ok: true }),
      readPresence: () => 't',
    });
    const res = await rt.executeFlow('bad', {});
    expect(res.ok).toBe(false);
    expect((res as { error?: string }).error).toBe('unknown_flow');
  });
});
