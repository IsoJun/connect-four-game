// @ts-nocheck
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { MAX_STAGE } from '../../logic/stages';
import {
  initCommonSounds,
  playTapSound,
} from '../../utils/sound';

export default function StageSelectScreen() {
  const router = useRouter();

  const [maxUnlockedStage, setMaxUnlockedStage] = useState(1);

  useFocusEffect(
    React.useCallback(() => {
      loadProgress();
      initCommonSounds();
    }, [])
  );

  async function loadProgress() {
    const saved = await AsyncStorage.getItem('maxUnlockedStage');

    const value = saved ? Number(saved) : 1;

    setMaxUnlockedStage(Math.max(1, value));
  }

  async function openStage(stage: number) {
    if (stage > maxUnlockedStage) return;

    await playTapSound();

    router.push(
      `/(tabs)/game?mode=stage&stage=${stage}&routeKey=${Date.now()}`
    );
  }

  async function handleBack() {
    await playTapSound();
    router.back();
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>ステージ選択</Text>

      <Text style={styles.progress}>
        解放: {maxUnlockedStage} / {MAX_STAGE}
      </Text>

      <ScrollView contentContainerStyle={styles.grid}>
        {Array.from({ length: MAX_STAGE }).map((_, index) => {
          const stage = index + 1;

          const unlocked = stage <= maxUnlockedStage;

          return (
            <TouchableOpacity
              key={stage}
              style={[
                styles.stageButton,
                !unlocked && styles.lockedButton,
              ]}
              disabled={!unlocked}
              onPress={() => openStage(stage)}
            >
              <Text
                style={[
                  styles.stageText,
                  !unlocked && styles.lockedText,
                ]}
              >
                {unlocked ? stage : '🔒'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBack}
      >
        <Text style={styles.backText}>← 戻る</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6fb',
    alignItems: 'center',
    padding: 16,
  },

  title: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 6,
  },

  progress: {
    fontSize: 15,
    fontWeight: '700',
    color: '#555',
    marginBottom: 16,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingBottom: 24,
  },

  stageButton: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: '#1565c0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  lockedButton: {
    backgroundColor: '#cfd8dc',
  },

  stageText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },

  lockedText: {
    color: '#607d8b',
    fontSize: 18,
  },

  backButton: {
    marginTop: 10,
    paddingVertical: 12,
  },

  backText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2b4c7e',
  },
});