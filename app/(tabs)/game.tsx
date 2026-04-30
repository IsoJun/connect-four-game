// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useRouter,
  useLocalSearchParams,
  useFocusEffect,
} from 'expo-router';
import { Audio } from 'expo-av';

import { useGame } from '../../hooks/useGame';
import { Board } from '../../components/Board';
import { ItemBar } from '../../components/ItemBar';
import { SkinSelector } from '../../components/SkinSelector';
import { StageHeader } from '../../components/StageHeader';

export default function GameScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const params = useLocalSearchParams();
  const initialStage = Number(params.stage || 1);

  const {
    board,
    player,
    result,
    winningCells,

    stage,
    maxStage,
    maxUnlockedStage,
    stageLevel,

    activeItem,
    setActiveItem,
    deleteLeft,
    pushDownLeft,
    pushRightLeft,

    showItemSelect,
    chooseStageItem,

    handleCellPress,
    handleColumnPress,

    selectedSkin,
    unlockedSkins,
    selectSkin,

    resetStage,
    goNextStage,
    goPrevStage,

    reloadSettings,
  } = useGame(initialStage);

  // =========================
  // 🔊 音処理
  // =========================
  const dropSound = useRef(null);
  const winSound = useRef(null);
  const drawSound = useRef(null);

  useEffect(() => {
    initSound();
  }, []);

  async function initSound() {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
      });

      const drop = new Audio.Sound();
      const win = new Audio.Sound();
      const draw = new Audio.Sound();

      await drop.loadAsync(require('../../assets/sounds/drop.wav'));
      await win.loadAsync(require('../../assets/sounds/win.wav'));
      await draw.loadAsync(require('../../assets/sounds/draw.wav'));

      dropSound.current = drop;
      winSound.current = win;
      drawSound.current = draw;
    } catch (e) {
      console.log('sound init error', e);
    }
  }

  function play(sound) {
    try {
      sound?.replayAsync();
    } catch {}
  }

  // =========================
  // 🔊 盤面更新音
  // =========================
  const prevBoard = useRef('');

  useEffect(() => {
    const now = JSON.stringify(board);

    if (prevBoard.current && prevBoard.current !== now) {
      play(dropSound.current);
    }

    prevBoard.current = now;
  }, [board]);

  // =========================
  // 🔊 勝敗音
  // =========================
  const prevResult = useRef('playing');

  useEffect(() => {
    if (result === prevResult.current) return;

    if (result === 'win') play(winSound.current);
    if (result === 'lose' || result === 'draw') play(drawSound.current);

    prevResult.current = result;
  }, [result]);

  // =========================
  // 🔄 設定反映
  // =========================
  useFocusEffect(
    React.useCallback(() => {
      reloadSettings();
      initSound(); // 音復旧
    }, [])
  );

  // =========================
  // 📐 可変盤面サイズ
  // =========================
  const rows = board.length;
  const columns = board[0]?.length || 1;

  const cellMargin = 2;
  const boardPadding = 6;

  const boardW = isLandscape ? width * 0.62 : width * 0.96;
  const boardH = isLandscape ? height * 0.82 : height * 0.48;

  const maxCellSize = columns >= 8 ? 50 : 58;

  const cellSize = Math.floor(
    Math.min(
      (boardW - boardPadding * 2) / columns - cellMargin * 2,
      (boardH - boardPadding * 2) / rows - cellMargin * 2,
      maxCellSize
    )
  );

  const disabled =
    result !== 'playing' || player !== 1;

  // =========================
  // 🎮 UI
  // =========================
  return (
    <SafeAreaView style={styles.container}>
      <View
        style={[
          styles.layout,
          { flexDirection: isLandscape ? 'row' : 'column' },
        ]}
      >
        {/* 盤面 */}
        <View
          style={[
            styles.boardArea,
            { width: isLandscape ? '65%' : '100%' },
          ]}
        >
          <Board
            board={board}
            cellSize={cellSize}
            cellMargin={cellMargin}
            boardPadding={boardPadding}
            activeItem={activeItem}
            disabled={disabled}
            winningCells={winningCells}
            redPiece={selectedSkin.red}
            yellowPiece={selectedSkin.yellow}
            onColumnPress={handleColumnPress}
            onCellPress={handleCellPress}
          />
        </View>

        {/* UI */}
        <ScrollView
          style={[
            styles.uiScroll,
            {
              width: isLandscape ? '35%' : '100%',
            },
          ]}
          contentContainerStyle={styles.uiArea}
        >
          <StageHeader
            stage={stage}
            maxStage={maxStage}
            maxUnlockedStage={maxUnlockedStage}
            stageLevel={stageLevel}
            result={result}
            onBack={() => router.back()}
            onRetry={resetStage}
            onPrevStage={goPrevStage}
            onNextStage={goNextStage}
          />

          <ItemBar
            activeItem={activeItem}
            deleteLeft={deleteLeft}
            pushDownLeft={pushDownLeft}
            pushRightLeft={pushRightLeft}
            disabled={disabled}
            onSelectItem={setActiveItem}
            onCancelItem={() => setActiveItem(null)}
          />

          <SkinSelector
            skins={unlockedSkins}
            selectedSkinId={selectedSkin.id}
            onSelectSkin={selectSkin}
          />
        </ScrollView>
      </View>

      {/* 🎉 勝利ポップ */}
      {result === 'win' && (
        <View style={styles.clearOverlay}>
          <View style={styles.clearModal}>
            <Text style={styles.clearTitle}>ステージクリア！</Text>

            {stage < maxStage ? (
              <TouchableOpacity
                style={styles.mainButton}
                onPress={goNextStage}
              >
                <Text style={styles.mainButtonText}>
                  次のステージへ
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.clearText}>
                全ステージクリア！
              </Text>
            )}

            <TouchableOpacity
              style={styles.subButton}
              onPress={() => router.back()}
            >
              <Text style={styles.subButtonText}>
                ステージ選択へ
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// =========================
// 🎨 Style
// =========================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6fb',
  },
  layout: {
    flex: 1,
  },
  boardArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uiScroll: {},
  uiArea: {
    padding: 10,
    alignItems: 'center',
  },

  clearOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearModal: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 20,
    width: '80%',
    alignItems: 'center',
  },
  clearTitle: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 16,
    color: '#ff7043',
  },
  clearText: {
    fontSize: 16,
    marginBottom: 16,
  },
  mainButton: {
    backgroundColor: '#ff7043',
    padding: 14,
    borderRadius: 12,
    width: '100%',
    marginBottom: 10,
    alignItems: 'center',
  },
  mainButtonText: {
    color: '#fff',
    fontWeight: '900',
  },
  subButton: {
    backgroundColor: '#1565c0',
    padding: 12,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  subButtonText: {
    color: '#fff',
    fontWeight: '800',
  },
});