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
import { PlayerItemBar } from '../../components/PlayerItemBar';
import { CELL } from '../../hooks/useGame';

export default function GameScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const params = useLocalSearchParams();
  const initialStage = Number(params.stage || 1);
  const mode = params.mode || 'stage';


  const {
    gameMode,

    board,
    player,
    result,
    winner, 
    winningCells,
    isCpuThinking,
    
    stage,
    maxStage,
    maxUnlockedStage,
    stageLevel,

    items,
    activeItem,
    setActiveItem,
   
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
  } = useGame(initialStage, mode);

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

  const isRedTurn = player === CELL.RED;
  const isYellowTurn = player === CELL.YELLOW;

 const isRedItemDisabled =
    result !== 'playing' || player !== CELL.RED;

  const isYellowItemDisabled =
    result !== 'playing' ||
    player !== CELL.YELLOW ||
    gameMode !== 'pvp';
  
    function handleMainAction() {
    if (gameMode === 'stage') {
      if (result === 'win') {
        if (stage < maxStage) {
          goNextStage();
        } else {
          resetStage();
        }
        return;
      }

      resetStage();
      return;
    }

    resetStage();
  }
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
          <View style={styles.infoPanel}>
          <Text style={styles.modeText}>
            {gameMode === 'stage' && 'ステージモード'}
            {gameMode === 'pvc' && 'CPU対戦'}
            {gameMode === 'pvp' && '2人対戦'}
          </Text>

          {result === 'playing' && (
            <Text style={styles.turnText}>
              {isCpuThinking
                ? 'CPU思考中...'
                : player === 1
                  ? '赤の番'
                  : gameMode === 'pvc'
                    ? 'CPUの番'
                    : '黄の番'}
            </Text>
          )}

          {result !== 'playing' && (
            <Text style={styles.resultText}>
              {getResultText(result, winner, gameMode)}
            </Text>
          )}
        </View>
          <Board
            board={board}
            cellSize={cellSize}
            cellMargin={cellMargin}
            boardPadding={boardPadding}
            activeItem={activeItem}
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
            gameMode={gameMode}

            stage={stage}
            maxStage={maxStage}
            maxUnlockedStage={maxUnlockedStage}
            stageLevel={stageLevel}

            result={result}

            onBack={() => router.back()}
            onRetry={resetStage}
            onPrevStage={goPrevStage}
            onNextStage={goNextStage}

            onStageSelect={() => router.push('/stages')}
            onTitle={() => router.replace('/')}
          />

          {/* 赤 */}
          <PlayerItemBar
            label="赤のアイテム"
            activeItem={activeItem}
            deleteLeft={items.red.delete}
            pushDownLeft={items.red.pushDown}
            pushRightLeft={items.red.pushRight}
            disabled={isRedItemDisabled}
            onSelectItem={setActiveItem}
            onCancelItem={() => setActiveItem(null)}
          />

          <PlayerItemBar
            label="黄のアイテム"
            activeItem={activeItem}
            deleteLeft={items.yellow.delete}
            pushDownLeft={items.yellow.pushDown}
            pushRightLeft={items.yellow.pushRight}
            disabled={isYellowItemDisabled}
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
      {result !== 'playing' && (
        <View style={styles.clearOverlay}>
        <View style={styles.clearModal}>

          <Text style={styles.clearTitle}>
            {getTitle(gameMode, result, winner)}
          </Text>

          {/* メインボタン */}
          <TouchableOpacity
            style={styles.mainButton}
            onPress={handleMainAction}
          >
            <Text style={styles.mainButtonText}>
              {getMainLabel(gameMode, result, stage, maxStage)}
            </Text>
          </TouchableOpacity>

          {/* サブボタン */}
          <TouchableOpacity
            style={styles.subButton}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.subButtonText}>
              タイトルに戻る
            </Text>
          </TouchableOpacity>

        </View>
      </View>
      )}
    </SafeAreaView>
  );
}

function getTitle(mode, result, winner) {
  if (mode === 'stage') {
    if (result === 'win') return 'ステージクリア！';
    if (result === 'lose') return '残念...';
    if (result === 'draw') return '引き分け';
  }

  if (mode === 'pvc' || mode === 'pvp') {
    return 'もう一度戦う？';
  }

  return '';
}

function getMainLabel(mode, result, stage, maxStage) {
  if (mode === 'stage') {
    if (result === 'win') {
      return stage < maxStage
        ? '次のステージへ'
        : '全ステージクリア！';
    }
    return 'リトライ';
  }

  return 'リトライ';
}

function getResultText(result: string, winner: number | null, gameMode: string) {
  if (result === 'draw') return '引き分け！';

  if (gameMode === 'pvp') {
    if (winner === 1) return '赤の勝ち！';
    if (winner === 2) return '黄の勝ち！';
  }

  if (gameMode === 'pvc') {
    if (winner === 1) return 'あなたの勝ち！';
    if (winner === 2) return 'CPUの勝ち';
  }

  if (gameMode === 'stage') {
    if (result === 'win') return 'ステージクリア！';
    if (result === 'lose') return '失敗...';
  }

  return '';
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
  infoPanel: {
    alignItems: 'center',
    marginBottom: 8,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#455a64',
    marginBottom: 4,
  },
  turnText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1565c0',
  },
  resultText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ff7043',
  },
});