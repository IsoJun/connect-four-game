// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { playTapSound } from '../../utils/sound';

import { useGame } from '../../hooks/useGame';
import { Board } from '../../components/Board';
import { StageHeader } from '../../components/StageHeader';
import { PlayerItemBar } from '../../components/PlayerItemBar';
import { CELL } from '../../hooks/useGame';
import { ITEM } from '../../logic/items';
import AdBanner from '../../components/AdBanner';

export default function GameScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const params = useLocalSearchParams();

  const rawStage = params.stage;
  const initialStage =
    typeof rawStage === 'string'
      ? Number(rawStage)
      : 1;

  const rawMode = params.mode;
  const mode =
    typeof rawMode === 'string'
      ? rawMode
      : 'stage';

  const rawRouteKey = params.routeKey;
  const routeKey =
    typeof rawRouteKey === 'string' ? rawRouteKey : '';
  const keyParam = params.key;

  // =========================
  // 🎬 アイテム使用バナー
  // =========================
  const [itemEffect, setItemEffect] = useState<{
    text: string;
    type: 'delete' | 'crash' | 'push';
  } | null>(null);

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
    itemSelectRule,
    chooseStageItems,

    handleCellPress,
    handleColumnPress,

    selectedSkin,

    resetStage,
    goNextStage,
    goPrevStage,

    reloadSettings,

    itemSoundEvent,
    boardEffectEvent,
    unlockedSkin,
    setUnlockedSkin,
  } = useGame(initialStage, mode, routeKey);

// =========================
// 🔄 設定反映
// =========================
const firstFocusRef = useRef(true);

useFocusEffect(
  React.useCallback(() => {
    reloadSettings();

    // 初回表示ではリセットしない
    if (firstFocusRef.current) {
      firstFocusRef.current = false;
      return;
    }

    // 設定画面から戻った時だけ
    if (gameMode === 'pvc' || gameMode === 'pvp') {
      resetStage();
    }
  }, [gameMode])
);

  // =========================
// 🔊 音処理
// =========================
const dropSound = useRef<Audio.Sound | null>(null);
const winSound = useRef<Audio.Sound | null>(null);
const drawSound = useRef<Audio.Sound | null>(null);

// アイテム使用音
const itemDeleteSound = useRef<Audio.Sound | null>(null); // 消す
const itemCrashSound = useRef<Audio.Sound | null>(null);  // 潰す
const itemPushSound = useRef<Audio.Sound | null>(null);   // 右へ

// アイテム使用時は、次の盤面更新音 drop.wav を鳴らさない
const skipNextDropSound = useRef(false);
const skipBoardChangeSound = useRef(false);

useEffect(() => {
  initSound();

  return () => {
    unloadSounds();
  };
}, []);

async function unloadSounds() {
  try {
    await dropSound.current?.unloadAsync();
    await winSound.current?.unloadAsync();
    await drawSound.current?.unloadAsync();

    await itemDeleteSound.current?.unloadAsync();
    await itemCrashSound.current?.unloadAsync();
    await itemPushSound.current?.unloadAsync();

    dropSound.current = null;
    winSound.current = null;
    drawSound.current = null;

    itemDeleteSound.current = null;
    itemCrashSound.current = null;
    itemPushSound.current = null;
  } catch (e) {
    console.log('sound unload error', e);
  }
}

async function initSound() {
  try {
    await unloadSounds();

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
    });

    const drop = new Audio.Sound();
    const win = new Audio.Sound();
    const draw = new Audio.Sound();

    const itemDelete = new Audio.Sound();
    const itemCrash = new Audio.Sound();
    const itemPush = new Audio.Sound();

    await drop.loadAsync(require('../../assets/sounds/drop.wav'));
    await win.loadAsync(require('../../assets/sounds/win.wav'));
    await draw.loadAsync(require('../../assets/sounds/draw.wav'));

    await itemDelete.loadAsync(require('../../assets/sounds/Item_Delete.wav'));
    await itemCrash.loadAsync(require('../../assets/sounds/Item_Crash.wav'));
    await itemPush.loadAsync(require('../../assets/sounds/Item_Push.wav'));

    dropSound.current = drop;
    winSound.current = win;
    drawSound.current = draw;

    itemDeleteSound.current = itemDelete;
    itemCrashSound.current = itemCrash;
    itemPushSound.current = itemPush;
  } catch (e) {
    console.log('sound init error', e);
  }
}

async function play(sound: Audio.Sound | null) {
  try {
    if (!sound) return;

    const status = await sound.getStatusAsync();

    if (!status.isLoaded) return;

    await sound.stopAsync();
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch (e) {
    console.log('sound play error', e);
  }
}

// =========================
// 🔊 アイテム使用音・バナー
// =========================
const prevItemSoundEventId = useRef(0);

useEffect(() => {
  if (!itemSoundEvent) return;
  if (itemSoundEvent.id === prevItemSoundEventId.current) return;

  prevItemSoundEventId.current = itemSoundEvent.id;

  // アイテム使用による board 更新では drop.wav を鳴らさない
  skipNextDropSound.current = true;

  if (itemSoundEvent.type === 'delete') {
    play(itemDeleteSound.current);
    setItemEffect({ text: '消す！', type: 'delete' });
  }

  if (itemSoundEvent.type === 'crash') {
    play(itemCrashSound.current);
    setItemEffect({ text: '潰す！', type: 'crash' });
  }

  if (itemSoundEvent.type === 'push') {
    play(itemPushSound.current);
    setItemEffect({ text: '右へ！', type: 'push' });
  }

  const timer = setTimeout(() => {
    setItemEffect(null);
  }, 700);

  return () => clearTimeout(timer);
}, [itemSoundEvent]);

  // =========================
  // 🔊 盤面更新音
  // =========================
  const prevBoard = useRef('');

  useEffect(() => {
    const now = JSON.stringify(board);

    if (prevBoard.current && prevBoard.current !== now) {

      // リセット・ステージ変更など
      if (skipBoardChangeSound.current) {
        skipBoardChangeSound.current = false;

      // アイテム使用後
      } else if (skipNextDropSound.current) {
        skipNextDropSound.current = false;

      // 通常のコマ配置
      } else {
        play(dropSound.current);
      }
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
    setUnlockedSkin(null);
    if (gameMode === 'stage') {
      if (result === 'win') {
        if (stage >= maxStage) {
          router.replace('/');
          return;
        }
        skipBoardChangeSound.current = true;
        goNextStage();
        return;
      }
    skipBoardChangeSound.current = true;
      resetStage();
      return;
    }
    skipBoardChangeSound.current = true;
    resetStage();
  }
  // =========================
  // 🎮 UI
  // =========================
  return (
    <LinearGradient
      colors={['#f7fbff', '#d9ecff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.screen}
    >
      <View style={styles.gameArea}>
      <SafeAreaView style={styles.container}>
        <View
          style={[
            styles.layout,
            { flexDirection: isLandscape ? 'row' : 'column' },
          ]}
        >
          {itemEffect && (
            <View
              style={[
                styles.itemEffectBanner,
                itemEffect.type === 'delete' && styles.itemEffectDelete,
                itemEffect.type === 'crash' && styles.itemEffectCrash,
                itemEffect.type === 'push' && styles.itemEffectPush,
              ]}
            >
              <Text style={styles.itemEffectText}>{itemEffect.text}</Text>
            </View>
          )}
          
          {/* 盤面 */}
          <View
            style={[
              styles.boardArea,
              { width: isLandscape ? '65%' : '100%' },
            ]}
          >

            <View style={styles.boardGlow} />
            <View style={styles.infoPanel}>
              <Text style={styles.modeText}>
                {gameMode === 'stage' && 'ステージモード'}
                {gameMode === 'pvc' && 'CPU対戦'}
                {gameMode === 'pvp' && '2人対戦'}
              </Text>

              {result === 'playing' && (
                <Text style={styles.turnText}>
                  {isCpuThinking
                    ? 'CPU思考中・・・'
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
            <View style={styles.boardWrapper}>
              <Board
                key={selectedSkin.id}
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
                currentPlayer={player}
                disabled={showItemSelect}
                boardEffectEvent={boardEffectEvent}
              />
            </View>
          </View>
          {/* UI */}
          <ScrollView
            style={[
              styles.uiScroll,
              {
                width: isLandscape ? '35%' : '100%',
                backgroundColor: '#e3ede0',
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
              onRetry={() => {
                skipBoardChangeSound.current = true;
                resetStage();
              }}
              onPrevStage={() => {
                skipBoardChangeSound.current = true;
                goPrevStage();
              }}
              onNextStage={() => {
                skipBoardChangeSound.current = true;
                goNextStage();
              }}

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

          </ScrollView>
        </View>

        {showItemSelect && (
          <ItemSelectPanel
            count={itemSelectRule.count}
            allowDuplicate={itemSelectRule.allowDuplicate}
            onConfirm={chooseStageItems}
            onTap={playTapSound}
          />
        )}

        {/* 🎉 勝利ポップ */}
        {result !== 'playing' && (
          <View style={styles.clearOverlay}>
            <View style={styles.clearModal}>
              <Text style={styles.clearTitle}>
                {getTitle(gameMode, result, winner, stage, maxStage)}
              </Text>
              {unlockedSkin && (
                <View style={styles.unlockPanel}>
                  <Text style={styles.unlockTitle}>
                    新スキン解放！
                  </Text>

                  <Text style={styles.unlockSkinName}>
                    {unlockedSkin.name}
                  </Text>

                  <Text style={styles.unlockDescription}>
                    {unlockedSkin.description}
                  </Text>
                </View>
              )}
              {gameMode === 'stage' && result === 'win' && stage >= maxStage && (
                <Text style={styles.completeMessage}>
                  全60ステージクリアおめでとうございます！
                </Text>
              )}
              {/* メインボタン */}
              <TouchableOpacity
                style={styles.mainButton}
                onPress={async () => {
                  await playTapSound();
                  handleMainAction();
                }}
              >
                <Text style={styles.mainButtonText}>
                  {getMainLabel(gameMode, result, stage, maxStage)}
                </Text>
              </TouchableOpacity>

              {/* サブボタン */}
              <TouchableOpacity
                style={styles.subButton}
                onPress={async () => {
                  await playTapSound();
                  router.replace('/');
                }}
              >
                <Text style={styles.subButtonText}>
                  タイトルに戻る
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          )}
        </SafeAreaView>
      </View>
      <AdBanner position="bottom" />
    </LinearGradient>
  );
}

function getTitle(mode, result, winner, stage, maxStage) {
  if (mode === 'stage') {
    if (result === 'win') {
      if (stage >= maxStage) return '全ステージ\nクリア！';
      return 'ステージクリア！';
    }

    if (result === 'lose') return 'もう一度挑戦！';
    if (result === 'draw') return '引き分け';
  }

  if (mode === 'pvc') {
    if (winner === 1) return 'あなたの勝ち！';
    if (winner === 2) return 'CPUの勝ち';
    if (result === 'draw') return '引き分け';
    return 'もう一度戦う？';
  }

  if (mode === 'pvp') {
    if (winner === 1) return '赤の勝ち！';
    if (winner === 2) return '黄の勝ち！';
    if (result === 'draw') return '引き分け';
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

function ItemSelectPanel({ count, allowDuplicate, onConfirm, onTap }) {
  const [selectedItems, setSelectedItems] = React.useState([]);

  function selectItem(item) {
    onTap?.();
    if (!allowDuplicate && selectedItems.includes(item)) {
      return;
    }

    if (selectedItems.length >= count) {
      return;
    }

    setSelectedItems((prev) => [...prev, item]);
  }

  function removeLast() {
    onTap?.();
    setSelectedItems((prev) => prev.slice(0, -1));
  }

  const canConfirm = selectedItems.length === count;

  return (
    <View style={styles.itemSelectPanel}>
      <Text style={styles.itemSelectTitle}>
        アイテムを {count} 個選んでください{allowDuplicate ? '（重複OK）' : ''}
      </Text>

      <View style={styles.itemSelectRow}>
        <TouchableOpacity
          style={[
            styles.itemSelectButton,
            selectedItems.includes(ITEM.DELETE) && styles.itemSelectButtonSelected,
          ]}
          onPress={() => selectItem(ITEM.DELETE)}
        >
          <Text style={styles.itemSelectButtonText}>消す</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.itemSelectButton,
            selectedItems.includes(ITEM.PUSH_DOWN) && styles.itemSelectButtonSelected,
          ]}
          onPress={() => selectItem(ITEM.PUSH_DOWN)}
        >
          <Text style={styles.itemSelectButtonText}>潰す</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.itemSelectButton,
            selectedItems.includes(ITEM.PUSH_RIGHT) && styles.itemSelectButtonSelected,
          ]}
          onPress={() => selectItem(ITEM.PUSH_RIGHT)}
        >
          <Text style={styles.itemSelectButtonText}>右へ</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.itemSelectStatus}>
        選択中: {selectedItems.map(getItemLabel).join(' / ') || 'なし'}
      </Text>

      <View style={styles.itemSelectRow}>
        <TouchableOpacity
          style={styles.itemSelectSubButton}
          onPress={removeLast}
        >
          <Text style={styles.itemSelectButtonText}>1つ戻す</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.itemSelectConfirmButton,
            !canConfirm && styles.disabledButton,
          ]}
          disabled={!canConfirm}
          onPress={() => {
            onTap?.();
            onConfirm(selectedItems);
          }}
        >
          <Text style={styles.itemSelectButtonText}>決定</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getItemLabel(item) {
  if (item === ITEM.DELETE) return '消す';
  if (item === ITEM.PUSH_DOWN) return '潰す';
  if (item === ITEM.PUSH_RIGHT) return '右へ';
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
    position: 'relative',
    overflow: 'visible',
  },
  uiScroll: {},
  uiArea: {
    padding: 10,
    alignItems: 'center',
  },

  clearOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '46%',
    backgroundColor: 'rgba(0, 0, 0, 0.23)',
    justifyContent: 'flex-start:',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  clearModal: {
    backgroundColor: '#fff',
    paddingVertical: 24,
    paddingHorizontal: 22,
    borderRadius: 24,
    width: '88%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  clearTitle: {
    fontSize: 34,
    fontWeight: '900',
    marginBottom: 20,
    color: '#ff7043',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 112, 67, 0.28)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 4,
  },
  clearText: {
    fontSize: 16,
    marginBottom: 16,
  },
  mainButton: {
    backgroundColor: '#ff7043',
    paddingVertical: 16,
    borderRadius: 16,
    width: '100%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 6,
  },
  mainButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 18,
  },
  subButton: {
    backgroundColor: '#1565c0',
    paddingVertical: 15,
    borderRadius: 15,
    width: '100%',
    alignItems: 'center',
  },
  subButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 17,
  },
  infoPanel: {
    alignItems: 'center',
    marginBottom: 2,

    backgroundColor: 'rgba(255,255,255,0.92)',

    paddingHorizontal: 18,
    paddingVertical: 2,

    borderRadius: 18,

    borderWidth: 2,
    borderColor: '#d6e8ff',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 4,

    elevation: 3,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#455a64',
    marginBottom: 4,
  },
  turnText: {
    fontSize: 21,
    fontWeight: '900',
    color: '#1565c0',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  resultText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ff7043',
  },

  itemSelectPanel: {
    width: '100%',
    backgroundColor: '#dbd87ae2',
    borderRadius: 14,
    padding: 12,
    marginVertical: 10,
    alignItems: 'center',
  },
  itemSelectTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 8,
  },
  itemSelectRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  itemSelectButton: {
    backgroundColor: '#1565c0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  itemSelectSubButton: {
    backgroundColor: '#546e7a',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  itemSelectConfirmButton: {
    backgroundColor: '#ff7043',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  itemSelectButtonText: {
    color: '#ffffff',
    fontWeight: '900',
  },
  itemSelectStatus: {
    fontSize: 13,
    fontWeight: '700',
    color: '#455a64',
    marginBottom: 8,
  },
  disabledButton: {
    opacity: 0.4,
  },
  itemEffectBanner: {
    position: 'absolute',
    top: '55%',
    alignSelf: 'center',
    zIndex: 999,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },

  itemEffectDelete: {
    backgroundColor: 'rgba(80, 120, 255, 0.92)',
  },

  itemEffectCrash: {
    backgroundColor: 'rgba(255, 80, 80, 0.92)',
  },

  itemEffectPush: {
    backgroundColor: 'rgba(60, 180, 100, 0.92)',
  },

  itemEffectText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
  },

  itemSelectButtonSelected: {
    backgroundColor: '#ff7043',
    borderColor: '#ffccbc',
  },

  completeMessage: {
    fontSize: 16,
    fontWeight: '800',
    color: '#455a64',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  screen: {
  flex: 1,
  },

  gameArea: {
    flex: 1,
  },
  unlockPanel: {
    width: '100%',

    backgroundColor: '#fff8e1',

    borderRadius: 18,

    paddingVertical: 8,
    paddingHorizontal: 16,

    marginBottom: 4,

    borderWidth: 3,
    borderColor: '#ffe082',

    alignItems: 'center',
  },

  unlockTitle: {
    fontSize: 15,
    fontWeight: '900',

    color: '#ff7043',

    marginBottom: 4,
  },

  unlockSkinName: {
    fontSize: 22,
    fontWeight: '900',

    color: '#37474f',

    marginBottom: 2,
  },

  unlockDescription: {
    fontSize: 11,
    fontWeight: '700',

    color: '#546e7a',

    textAlign: 'center',
  },
  boardGlow: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 999,
    backgroundColor: 'rgba(33, 150, 243, 0.28)',
    zIndex: 0,
  },
  boardWrapper: {
    zIndex: 2,

    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 22,
    padding: 6,

    shadowColor: '#0d47a1',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.35,
    shadowRadius: 16,

    elevation: 14,
  },
});