import { Platform } from 'react-native';
import * as ExpoClipboard from 'expo-clipboard';

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    await ExpoClipboard.setStringAsync(text);
    return true;
  } catch (err) {
    try {
      await ExpoClipboard.setStringAsync(text);
      return true;
    } catch {
      console.warn('Clipboard copy failed:', err);
      return false;
    }
  }
}
