import * as SecureStore from 'expo-secure-store';
import { CACHED_KEYS } from '../consts/cachedKeys';
import { uuidV4 } from './common';

export async function getFingerprint(): Promise<string> {
  try {
    const existing = await SecureStore.getItemAsync(CACHED_KEYS.DEVICE_ID);
    if (existing && existing.length >= 16) {
      return existing;
    }
    const created = `mobile-${uuidV4()}`;
    await SecureStore.setItemAsync(CACHED_KEYS.DEVICE_ID, created);
    return created;
  } catch {
    return `mobile-${uuidV4()}`;
  }
}

export default getFingerprint;
