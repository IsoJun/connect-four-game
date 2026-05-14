// @ts-nocheck
import React, { useEffect, useState } from 'react';
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
import {
  initCommonSounds,
  playTapSound,
} from '../../utils/sound';

const STORAGE_KEYS = {
  MAX_UNLOCKED_STAGE: 'maxUnlockedStage',
  SKIN: 'skin',
  BOARD_SIZE: 'boardSize',
  CPU_LEVEL: 'cpuLevel',
  PVP_ITEMS: 'pvpItems',
};

const defaultPvpItems = {
  red: { delete: 0, pushDown: 0, pushRight: 0 },
  yellow: { delete: 0, pushDown: 0, pushRight: 0 },
};

export default function SettingsScreen() {
  const router = useRouter();

  const [maxUnlockedStage, setMaxUnlockedStage] = useState(1);

  const [savedSkinId, setSavedSkinId] = useState('normal');
  const [savedBoardSize, setSavedBoardSize] = useState('6x7');
  const [savedCpuLevel, setSavedCpuLevel] = useState(5);

  const [draftSkinId, setDraftSkinId] = useState('normal');
  const [draftBoardSize, setDraftBoardSize] = useState('6x7');
  const [draftCpuLevel, setDraftCpuLevel] = useState(5);

  const [pvpItems, setPvpItems] = useState(defaultPvpItems);

  useFocusEffect(
    React.useCallback(() => {
      loadSettings();
    }, [])
  );

  useEffect(() => {
    initCommonSounds();
  }, []);

  async function loadSettings() {
    const savedStage = await AsyncStorage.getItem(
      STORAGE_KEYS.MAX_UNLOCKED_STAGE
    );
    const skin = await AsyncStorage.getItem(STORAGE_KEYS.SKIN);
    const size = await AsyncStorage.getItem(STORAGE_KEYS.BOARD_SIZE);
    const cpu = await AsyncStorage.getItem(STORAGE_KEYS.CPU_LEVEL);
    const savedPvp = await AsyncStorage.getItem(STORAGE_KEYS.PVP_ITEMS);

    const nextStage = savedStage ? Number(savedStage) : 1;
    const nextSkin = skin || 'normal';
    const nextSize = size || '6x7';
    const nextCpu = cpu ? Number(cpu) : 5;

    function normalizeItems(items) {
      return {
        delete: items?.delete ?? 0,
        pushDown: items?.pushDown ?? 0,
        pushRight: items?.pushRight ?? 0,
      };
    }

    if (savedPvp) {
      const parsed = JSON.parse(savedPvp);

      setPvpItems({
        red: normalizeItems(parsed.red),
        yellow: normalizeItems(parsed.yellow),
      });
    } else {
      setPvpItems(defaultPvpItems);
    }

    setMaxUnlockedStage(nextStage);

    setSavedSkinId(nextSkin);
    setSavedBoardSize(nextSize);
    setSavedCpuLevel(nextCpu);

    setDraftSkinId(nextSkin);
    setDraftBoardSize(nextSize);
    setDraftCpuLevel(nextCpu);
  }

  async function saveSettings() {
    await AsyncStorage.setItem(STORAGE_KEYS.SKIN, draftSkinId);
    await AsyncStorage.setItem(STORAGE_KEYS.BOARD_SIZE, draftBoardSize);
    await AsyncStorage.setItem(
      STORAGE_KEYS.CPU_LEVEL,
      String(draftCpuLevel)
    );
    await AsyncStorage.setItem(
      STORAGE_KEYS.PVP_ITEMS,
      JSON.stringify(pvpItems)
    );

    router.back();
  }

  function cancelSettings() {
    setDraftSkinId(savedSkinId);
    setDraftBoardSize(savedBoardSize);
    setDraftCpuLevel(savedCpuLevel);
    router.back();
  }

  function confirmResetProgress() {
    Alert.alert('確認', 'ステージ進行をリセットしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'リセット',
        style: 'destructive',
        onPress: resetProgress,
      },
    ]);
  }

  function updatePvpItem(color, key, value) {
    setPvpItems((prev) => ({
      ...prev,
      [color]: {
        ...prev[color],
        [key]: value,
      },
    }));
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
        {/* コマスキン */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>コマスキン</Text>
          <Text style={styles.sectionDescription}>
            ゲーム中に表示される赤・黄のコマデザインを変更します。
          </Text>

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

        {/* 対戦アイテム */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>対戦アイテム設定</Text>
          <Text style={styles.sectionDescription}>
            CPU対戦・2人対戦で、赤と黄が最初から持つアイテム数を設定します。
          </Text>

          <PlayerItemSettingCard
            title="赤プレイヤー"
            color="red"
            items={pvpItems.red}
            onChange={updatePvpItem}
          />

          <PlayerItemSettingCard
            title="黄プレイヤー"
            color="yellow"
            items={pvpItems.yellow}
            onChange={updatePvpItem}
          />
        </View>

        {/* 盤面サイズ */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>盤面サイズ</Text>
          <Text style={styles.sectionDescription}>
            対戦時の盤面サイズを選びます。
          </Text>

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
        </View>

        {/* CPUレベル */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>CPUレベル</Text>
          <Text style={styles.sectionDescription}>
            数字が大きいほどCPUが強くなります。
          </Text>
          <Text style={styles.cpuUnlockText}>
            「神」は全60ステージクリアで解放
          </Text>

          <View style={styles.levelGrid}>
            {Array.from({ length: 11 }, (_, i) => i + 1).map((lv) => {
              const active = lv === draftCpuLevel;

              const locked =
                lv === 11 && maxUnlockedStage < 60;

              return (
                <TouchableOpacity
                  key={lv}
                  disabled={locked}
                  style={[
                    styles.levelButton,
                    active && styles.activeLevelButton,
                    locked && styles.lockedLevelButton,
                  ]}
                  onPress={() => setDraftCpuLevel(lv)}
                >
                  <Text
                    style={[
                      styles.levelText,
                      active && styles.activeLevelText,
                      locked && styles.lockedLevelText,
                    ]}
                  >
                    {lv === 11 ? '神' : lv}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* データ */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>データ</Text>
          <Text style={styles.sectionDescription}>
            ステージの進行状況を初期状態に戻します。
          </Text>

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
          onPress={async () => {
            await playTapSound();
            cancelSettings();
          }}
        >
          <Text style={styles.footerText}>キャンセル</Text>
        </TouchableOpacity>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={async () => {
          await playTapSound();
          saveSettings();
        }}
      >
        <Text style={styles.footerText}>OK</Text>
      </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function PlayerItemSettingCard({ title, color, items, onChange }) {
  return (
    <View
      style={[
        styles.playerItemCard,
        color === 'red' && styles.redPlayerCard,
        color === 'yellow' && styles.yellowPlayerCard,
      ]}
    >
      <Text style={styles.playerItemTitle}>{title}</Text>

      <ItemCounter
        label="消す"
        description="選んだ自分のコマを1つ消す"
        value={items.delete}
        onChange={(v) => onChange(color, 'delete', v)}
      />

      <ItemCounter
        label="潰す"
        description="自分のコマが一番下の時、選んだ列を上から押しつぶす"
        value={items.pushDown}
        onChange={(v) => onChange(color, 'pushDown', v)}
      />

      <ItemCounter
        label="右へ"
        description="選んだ自分のコマを右方向へ押す"
        value={items.pushRight}
        onChange={(v) => onChange(color, 'pushRight', v)}
      />
    </View>
  );
}

function ItemCounter({ label, description, value, onChange }) {
  return (
    <View style={styles.itemCounterRow}>
      <View style={styles.itemCounterTextArea}>
        <Text style={styles.itemCounterLabel}>{label}</Text>
        <Text style={styles.itemCounterDescription}>{description}</Text>
      </View>

      <View style={styles.counterControls}>
        <TouchableOpacity
          style={styles.counterButton}
          onPress={() => onChange(Math.max(0, value - 1))}
        >
          <Text style={styles.counterButtonText}>−</Text>
        </TouchableOpacity>

        <View style={styles.counterValueBox}>
          <Text style={styles.counterValue}>{value}</Text>
        </View>

        <TouchableOpacity
          style={styles.counterButton}
          onPress={() => onChange(Math.min(9, value + 1))}
        >
          <Text style={styles.counterButtonText}>＋</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6fb',
    padding: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 14,
    color: '#263238',
  },
  content: {
    paddingBottom: 40,
  },

  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 6,
    color: '#263238',
  },
  sectionDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#607d8b',
    marginBottom: 12,
  },

  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  optionButton: {
    backgroundColor: '#eceff1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeButton: {
    backgroundColor: '#ff7043',
    borderColor: '#ffccbc',
  },
  optionText: {
    fontWeight: '900',
    color: '#37474f',
  },
  activeText: {
    color: '#fff',
  },

  playerItemCard: {
    borderRadius: 16,
    padding: 12,
    marginTop: 10,
    borderWidth: 2,
  },
  redPlayerCard: {
    backgroundColor: '#fff5f5',
    borderColor: '#ffcdd2',
  },
  yellowPlayerCard: {
    backgroundColor: '#fffde7',
    borderColor: '#ffe082',
  },
  playerItemTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#263238',
    marginBottom: 8,
  },

  itemCounterRow: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemCounterTextArea: {
    flex: 1,
    paddingRight: 10,
  },
  itemCounterLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: '#263238',
  },
  itemCounterDescription: {
    fontSize: 12,
    color: '#607d8b',
    marginTop: 2,
  },

  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#1565c0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButtonText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 24,
  },
  counterValueBox: {
    minWidth: 38,
    height: 34,
    marginHorizontal: 6,
    borderRadius: 10,
    backgroundColor: '#eceff1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValue: {
    fontSize: 17,
    fontWeight: '900',
    color: '#263238',
  },

  levelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  levelButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eceff1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeLevelButton: {
    backgroundColor: '#1565c0',
  },
  levelText: {
    fontWeight: '900',
    fontSize: 16,
    color: '#263238',
  },
  activeLevelText: {
    color: '#fff',
  },
  cpuUnlockText: {
  fontSize: 12,
  color: '#607d8b',
  marginBottom: 10,
  fontWeight: '700',
  },
    lockedLevelButton: {
    backgroundColor: '#cfd8dc',
    opacity: 0.5,
  },
  lockedLevelText: {
    color: '#78909c',
  },

  resetButton: {
    backgroundColor: '#d32f2f',
    paddingVertical: 14,
    borderRadius: 14,
  },
  resetText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '900',
  },

  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#9e9e9e',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#1565c0',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  footerText: {
    color: '#fff',
    fontWeight: '900',
  },
});