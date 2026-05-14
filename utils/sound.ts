// @ts-nocheck
import { Audio } from 'expo-av';

let tapSound: Audio.Sound | null = null;

let initialized = false;

// =========================
// 初期化
// =========================
export async function initCommonSounds() {
  try {
    if (initialized) return;

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
    });

    tapSound = new Audio.Sound();

    await tapSound.loadAsync(
      require('../assets/sounds/tap.wav')
    );

    initialized = true;

    console.log('common sounds initialized');
  } catch (e) {
    console.log('sound init error', e);
  }
}

// =========================
// タップ音
// =========================
export async function playTapSound() {
  try {
    if (!tapSound) return;

    const status = await tapSound.getStatusAsync();

    if (!status.isLoaded) return;

    await tapSound.stopAsync();
    await tapSound.setPositionAsync(0);
    await tapSound.playAsync();
  } catch (e) {
    console.log('tap sound error', e);
  }
}

// =========================
// 解放
// =========================
export async function unloadCommonSounds() {
  try {
    await tapSound?.unloadAsync();

    tapSound = null;

    initialized = false;
  } catch (e) {
    console.log('sound unload error', e);
  }
}