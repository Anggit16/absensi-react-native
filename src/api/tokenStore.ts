/**
 * Penyimpanan token sesi.
 *
 * - Native (iOS/Android): expo-secure-store (Keychain/Keystore).
 * - Web: localStorage, karena expo-secure-store tidak tersedia di browser.
 */

import { Platform } from 'react-native';

const TOKEN_KEY = 'absensipro.auth.token';

export async function saveToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(TOKEN_KEY, token);
    return;
  }

  const SecureStore = await import('expo-secure-store');
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function loadToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return globalThis.localStorage?.getItem(TOKEN_KEY) ?? null;
    }

    const SecureStore = await import('expo-secure-store');
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function clearToken(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.removeItem(TOKEN_KEY);
      return;
    }

    const SecureStore = await import('expo-secure-store');
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // Tidak ada token tersimpan: abaikan.
  }
}
