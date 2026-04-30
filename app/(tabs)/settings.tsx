// @ts-nocheck
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getUnlockedSkins } from '../../logic/skins';

const STORAGE_KEYS = {
  MAX_UNLOCKED_STAGE: 'maxUnlockedStage',
  SKIN: 'skin',
  BOARD_SIZE: 'boardSize',
};

export default function SettingsScreen() {
  const router = useRouter();

  const [maxUnlockedStage, setMaxUnlockedStage] = useState(1);

  const [savedSkinId, setSavedSkinId] = useState('normal');
  const [savedBoardSize, setSavedBoardSize] = useState('6x7');

  const [draftSkinId, setDraftSkinId] = useState('normal');
  const [draftBoardSize, setDraftBoardSize] = useState('6x7');

  useFocusEffect(
    React.useCallback(() => {
      loadSettings();
    }, [])
  );

  async function loadSettings() {
    const savedStage = await AsyncStorage.getItem(
      STORAGE_KEYS.MAX_UNLOCKED_STAGE
    );
    const skin = await AsyncStorage.getItem(STORAGE_KEYS.SKIN);
    const size = await AsyncStorage.getItem(STORAGE_KEYS.BOARD_SIZE);

    const nextStage = savedStage ? Number(savedStage) : 1;
    const nextSkin = skin || 'normal';
    const nextSize = size || '6x7';

    setMaxUnlockedStage(nextStage);

    setSavedSkinId(nextSkin);
    setSavedBoardSize(nextSize);

    setDraftSkinId(nextSkin);
    setDraftBoardSize(nextSize);
  }

  async function saveSettings() {
    await AsyncStorage.setItem(STORAGE_KEYS.SKIN, draftSkinId);
    await AsyncStorage.setItem(STORAGE_KEYS.BOARD_SIZE, draftBoardSize);
    console.log('save board size:', draftBoardSize);
    router.back();
  }

  function cancelSettings() {
    setDraftSkinId(savedSkinId);
    setDraftBoardSize(savedBoardSize);
    router.back();
  }

  function confirmResetProgress() {
    Alert.alert(
      '確認',
      'ステージ進行をリセットしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'リセット',
          style: 'destructive',
          onPress: resetProgress,
        },
      ]
    );
  }

  async function resetProgress() {
    await AsyncStorage.setItem(STORAGE_KEYS.MAX_UNLOCKED_STAGE, '1');
    setMaxUnlockedStage(1);
  }

  const skins = getUnlockedSkins(maxUnlockedStage);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>設定</Text>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>コマスキン</Text>

          <View style={styles.row}>
            {skins.map((skin) => {
              const active = skin.id === draftSkinId;

              return (
                <TouchableOpacity
                  key={skin.id}
                  style={[
                    styles.optionButton,
                    active && styles.activeButton,
                  ]}
                  onPress={() => setDraftSkinId(skin.id)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      active && styles.activeText,
                    ]}
                  >
                    {skin.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>盤面サイズ</Text>

          <View style={styles.row}>
            {['6x7', '8x8'].map((size) => {
              const active = size === draftBoardSize;

              return (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.optionButton,
                    active && styles.activeButton,
                  ]}
                  onPress={() => setDraftBoardSize(size)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      active && styles.activeText,
                    ]}
                  >
                    {size}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.note}>
            ※ 保存後、ゲーム画面に戻ると盤面がリセットされて反映されます
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>データ</Text>

          <TouchableOpacity
            style={styles.resetButton}
            onPress={confirmResetProgress}
          >
            <Text style={styles.resetText}>
              ステージ進行をリセット
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={cancelSettings}
        >
          <Text style={styles.cancelText}>キャンセル</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveSettings}
        >
          <Text style={styles.saveText}>OK</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6fb',
    padding: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 14,
  },
  content: {
    paddingBottom: 40,
  },
  section: {
    marginBottom: 26,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  activeButton: {
    backgroundColor: '#ff7043',
  },
  optionText: {
    fontWeight: '800',
    color: '#333',
  },
  activeText: {
    color: '#fff',
  },
  note: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#d32f2f',
    paddingVertical: 14,
    borderRadius: 12,
  },
  resetText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '900',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#9e9e9e',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#1565c0',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
  saveText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
});