import { Platform } from 'react-native';
import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from 'expo-tracking-transparency';

export async function requestTrackingPermissionIfNeeded() {
  if (Platform.OS !== 'ios') {
    return;
  }

  const current = await getTrackingPermissionsAsync();

  if (current.status === 'undetermined') {
    await requestTrackingPermissionsAsync();
  }
}