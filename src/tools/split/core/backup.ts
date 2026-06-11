import type { Trip } from './types';
import { decodePayload, encodePayload } from '../../../shared/payload';

/**
 * 账本 ↔ URL 安全字符串，用于分享 / 备份链接。
 * 编解码本体在 shared/payload.ts；旧版裸 Trip 载荷由 decodePayload 兼容识别。
 */
export function encodeTrip(trip: Trip): Promise<string> {
  return encodePayload('trip', trip);
}

export async function decodeTrip(payload: string): Promise<Trip> {
  const { kind, data } = await decodePayload(payload);
  const trip = data as Trip;
  if (
    kind !== 'trip' ||
    !trip ||
    typeof trip.id !== 'string' ||
    !Array.isArray(trip.members) ||
    !Array.isArray(trip.expenses)
  ) {
    throw new Error('invalid trip payload');
  }
  return trip;
}
