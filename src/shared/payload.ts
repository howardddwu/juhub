/**
 * 通用 URL 载荷编解码：JSON → deflate 压缩 → base64url。
 * kind 区分载荷类型（trip / vote / …），新工具的分享数据走同一套编码。
 * 兼容旧版：Farely 时代的载荷是裸 Trip 对象（无 kind 包装），解码时识别为 'trip'。
 */

export async function encodePayload(kind: string, data: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify({ k: kind, d: data }));
  return bytesToBase64Url(await compress(bytes));
}

export async function decodePayload(payload: string): Promise<{ kind: string; data: unknown }> {
  const bytes = await decompress(base64UrlToBytes(payload));
  const parsed = JSON.parse(new TextDecoder().decode(bytes)) as { k?: unknown; d?: unknown };
  if (parsed && typeof parsed.k === 'string' && 'd' in parsed) return { kind: parsed.k, data: parsed.d };
  return { kind: 'trip', data: parsed };
}

async function compress(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new CompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function decompress(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function base64UrlToBytes(s: string): Uint8Array {
  const b64 = s.replaceAll('-', '+').replaceAll('_', '/');
  const padded = b64.padEnd(Math.ceil(b64.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}
