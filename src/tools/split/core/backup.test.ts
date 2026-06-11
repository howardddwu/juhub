import { describe, expect, it } from 'vitest';
import type { Trip } from './types';
import { decodeTrip, encodeTrip } from './backup';

const trip: Trip = {
  id: 't1',
  name: '三亚五日游',
  members: [
    { id: 'a', name: '小明' },
    { id: 'b', name: '小红' },
  ],
  expenses: [
    {
      id: 'e1',
      description: '晚饭',
      amountCents: 32000,
      payerId: 'a',
      participantIds: ['a', 'b'],
      split: { type: 'equal' },
      createdAt: 1,
    },
  ],
  currency: 'CNY',
  createdAt: 1,
};

describe('backup encode/decode', () => {
  it('编码后可无损还原', async () => {
    const payload = await encodeTrip(trip);
    expect(payload).toMatch(/^[A-Za-z0-9_-]+$/); // URL 安全
    expect(await decodeTrip(payload)).toEqual(trip);
  });

  it('非法 payload 报错', async () => {
    await expect(decodeTrip('not-a-valid-payload')).rejects.toThrow();
  });

  it('兼容 Farely 旧版裸 Trip 载荷（无 kind 包装）', async () => {
    const bytes = new TextEncoder().encode(JSON.stringify(trip));
    const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new CompressionStream('deflate'));
    const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
    let bin = '';
    for (const b of compressed) bin += String.fromCharCode(b);
    const legacyPayload = btoa(bin).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
    expect(await decodeTrip(legacyPayload)).toEqual(trip);
  });
});
