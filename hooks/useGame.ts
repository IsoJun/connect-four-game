// @ts-nocheck
import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  CELL,
  createBoard,
  parseBoardSize,
  dropPiece as drop,
  checkWin,
  isBoardFull,
  getWinningCells,
  findAnyWin,
} from '../logic/gameLogic';

import { getCpuAction } from '../logic/cpu';

import {
  deletePiece,
  pushColumnFromTop,
  pushPieceRight,
  ITEM,
} from '../logic/items';

import {
  MAX_STAGE,
  clampStage,
  getStageConfig,
  getNextStage,
  getPrevStage,
} from '../logic/stages';

import {
  getSkinById,
  getUnlockedSkins,
  SKINS,
} from '../logic/skins';

type ItemSoundType = 'delete' | 'crash' | 'push';

type ItemSoundEvent = {
  type: ItemSoundType;
  id: number;
};

type ItemEffectType = 'delete' | 'crash' | 'push';

type BoardEffectCell = {
  row: number;
  col: number;
};

type BoardEffectEvent = {
  id: number;
  type: ItemEffectType;
  cells: BoardEffectCell[];
};

export { CELL };

export const RESULT = {
  PLAYING: 'playing',
  WIN: 'win',
  LOSE: 'lose',
  DRAW: 'draw',
};

export const GAME_MODE = {
  STAGE: 'stage',
  PVC: 'pvc',
  PVP: 'pvp',
};

export const STORAGE_KEYS = {
  MAX_UNLOCKED_STAGE: 'maxUnlockedStage',
  SKIN: 'skin',
  BOARD_SIZE: 'boardSize',
  CPU_LEVEL: 'cpuLevel',
  PVP_ITEMS: 'pvpItems',
};

const defaultBattleItems = {
  red: { delete: 0, pushDown: 0, pushRight: 0 },
  yellow: { delete: 0, pushDown: 0, pushRight: 0 },
};

function stageToCpuLevel(stage: number): number {
  if (stage <= 6) return 1;
  if (stage <= 12) return 2;
  if (stage <= 18) return 3;
  if (stage <= 24) return 4;
  if (stage <= 30) return 5;
  if (stage <= 36) return 6;
  if (stage <= 42) return 7;
  if (stage <= 48) return 8;
  if (stage <= 54) return 9;
  return 10;
}

function clampCpuLevel(level: number): number {
  if (Number.isNaN(level)) return 5;
  return Math.min(11, Math.max(1, level));
}

function normalizeMode(mode: string) {
  if (mode === GAME_MODE.PVC) return GAME_MODE.PVC;
  if (mode === GAME_MODE.PVP) return GAME_MODE.PVP;
  return GAME_MODE.STAGE;
}

export function useGame(initialStage, mode, routeKey) {
  const gameMode = normalizeMode(mode);

  const [boardSize, setBoardSize] = useState('6x7');
  const boardSizeRef = useRef('6x7');

  const [board, setBoard] = useState(createSizedBoard('6x7'));
  const [player, setPlayer] = useState(CELL.RED);
  const [result, setResult] = useState(RESULT.PLAYING);
  const [winningCells, setWinningCells] = useState([]);
  const [winner, setWinner] = useState(null);
  const [lastMove, setLastMove] = useState(null);

  const [stage, setStage] = useState(clampStage(Number(initialStage || 1)));
  const [maxUnlockedStage, setMaxUnlockedStage] = useState(1);
  const [loaded, setLoaded] = useState(false);

  const [activeItem, setActiveItem] = useState(null);
  const [items, setItems] = useState(defaultBattleItems);
  const [pvpItems, setPvpItems] = useState(defaultBattleItems);
  const pvpItemsRef = useRef(defaultBattleItems);

  const [showItemSelect, setShowItemSelect] = useState(false);
  const [itemSelectRule, setItemSelectRule] = useState({
    count: 1,
    allowDuplicate: false,
  });

  const [selectedSkinId, setSelectedSkinId] = useState('normal');
  const [selectedCpuLevel, setSelectedCpuLevel] = useState(5);
  const [isCpuThinking, setIsCpuThinking] = useState(false);
  const [unlockedSkin, setUnlockedSkin] = useState(null);

  const [itemSoundEvent, setItemSoundEvent] =
    useState<ItemSoundEvent | null>(null);
  const itemSoundEventId = useRef(0);

  const [boardEffectEvent, setBoardEffectEvent] =
    useState<BoardEffectEvent | null>(null);
  const boardEffectEventId = useRef(0);

  const config = getStageConfig(stage);

  function createSizedBoard(size: string) {
    const parsed = parseBoardSize(size);
    return createBoard(parsed.rows, parsed.columns);
  }

  function notifyItemSound(type: ItemSoundType) {
    itemSoundEventId.current += 1;

    setItemSoundEvent({
      type,
      id: itemSoundEventId.current,
    });
  }

  function notifyBoardEffect(type: ItemEffectType, cells: BoardEffectCell[]) {
    boardEffectEventId.current += 1;

    setBoardEffectEvent({
      id: boardEffectEventId.current,
      type,
      cells,
    });
  }

  function normalizeItems(items) {
    return {
      delete: items?.delete ?? 0,
      pushDown: items?.pushDown ?? 0,
      pushRight: items?.pushRight ?? 0,
    };
  }

  function normalizeBattleItems(nextItems) {
    return {
      red: normalizeItems(nextItems?.red),
      yellow: normalizeItems(nextItems?.yellow),
    };
  }

  function isSameBattleItems(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  useEffect(() => {
    loadProgress();
  }, []);

  useEffect(() => {
    if (!loaded) return;

    const requestedStage = clampStage(Number(initialStage || 1));

    const playableStage =
      gameMode === GAME_MODE.STAGE
        ? Math.min(requestedStage, maxUnlockedStage)
        : 1;

    startStage(playableStage, maxUnlockedStage, boardSizeRef.current);
  }, [initialStage, loaded, gameMode]);

  useEffect(() => {
    if (!loaded) return;
    if (gameMode !== GAME_MODE.STAGE) return;

    const requestedStage = clampStage(Number(initialStage || 1));
    const playableStage = Math.min(requestedStage, maxUnlockedStage);

    startStage(playableStage, maxUnlockedStage, boardSizeRef.current);
  }, [routeKey, loaded]);

  async function loadProgress() {
    const savedStage = await AsyncStorage.getItem(
      STORAGE_KEYS.MAX_UNLOCKED_STAGE
    );
    const savedSkin = await AsyncStorage.getItem(STORAGE_KEYS.SKIN);
    const savedPvpItems = await AsyncStorage.getItem(STORAGE_KEYS.PVP_ITEMS);
    const savedBoardSize = await AsyncStorage.getItem(STORAGE_KEYS.BOARD_SIZE);
    const savedCpuLevel = await AsyncStorage.getItem(STORAGE_KEYS.CPU_LEVEL);

    const unlocked = savedStage ? clampStage(Number(savedStage)) : 1;
    const nextBoardSize = savedBoardSize || '6x7';
    const nextCpuLevel = savedCpuLevel
      ? clampCpuLevel(Number(savedCpuLevel))
      : 5;

    const nextPvpItems = savedPvpItems
      ? JSON.parse(savedPvpItems)
      : defaultBattleItems;

    const normalizedPvpItems = normalizeBattleItems(nextPvpItems);

    setMaxUnlockedStage(unlocked);
    setPvpItems(normalizedPvpItems);
    pvpItemsRef.current = normalizedPvpItems;

    setBoardSize(nextBoardSize);
    boardSizeRef.current = nextBoardSize;

    setSelectedSkinId(savedSkin || 'normal');
    setSelectedCpuLevel(nextCpuLevel);

    setLoaded(true);
  }

  async function reloadSettings() {
    const savedStage = await AsyncStorage.getItem(
      STORAGE_KEYS.MAX_UNLOCKED_STAGE
    );
    const savedSkin = await AsyncStorage.getItem(STORAGE_KEYS.SKIN);
    const savedPvpItems = await AsyncStorage.getItem(STORAGE_KEYS.PVP_ITEMS);
    const savedBoardSize = await AsyncStorage.getItem(STORAGE_KEYS.BOARD_SIZE);
    const savedCpuLevel = await AsyncStorage.getItem(STORAGE_KEYS.CPU_LEVEL);

    const nextUnlockedStage = savedStage
      ? clampStage(Number(savedStage))
      : 1;

    const nextSkinId = savedSkin || 'normal';
    const nextBoardSize = savedBoardSize || '6x7';
    const nextCpuLevel = savedCpuLevel
      ? clampCpuLevel(Number(savedCpuLevel))
      : 5;

    const nextPvpItems = savedPvpItems
      ? JSON.parse(savedPvpItems)
      : defaultBattleItems;

    const normalizedPvpItems = normalizeBattleItems(nextPvpItems);

    const boardSizeChanged = nextBoardSize !== boardSizeRef.current;
    const cpuLevelChanged = nextCpuLevel !== selectedCpuLevel;
    const pvpItemsChanged = !isSameBattleItems(
      normalizedPvpItems,
      pvpItemsRef.current
    );

    const currentStageLocked =
      gameMode === GAME_MODE.STAGE && stage > nextUnlockedStage;

    setSelectedSkinId(nextSkinId);
    setSelectedCpuLevel(nextCpuLevel);
    setMaxUnlockedStage(nextUnlockedStage);

    setPvpItems(normalizedPvpItems);
    pvpItemsRef.current = normalizedPvpItems;

    if (boardSizeChanged) {
      setBoardSize(nextBoardSize);
      boardSizeRef.current = nextBoardSize;
    }

    if (
      boardSizeChanged ||
      cpuLevelChanged ||
      currentStageLocked
    ) {
      const nextStage =
        gameMode === GAME_MODE.STAGE
          ? currentStageLocked
            ? 1
            : Math.min(stage, nextUnlockedStage)
          : 1;

      startStage(nextStage, nextUnlockedStage, nextBoardSize);
      return;
    }

    if (gameMode === GAME_MODE.PVP || gameMode === GAME_MODE.PVC) {
      setActiveItem(null);
      setItems({
        red: normalizeItems(pvpItemsRef.current.red),
        yellow: normalizeItems(pvpItemsRef.current.yellow),
      });
    }
  }

  async function saveUnlockedStage(nextUnlockedStage: number) {
    const safeStage = clampStage(nextUnlockedStage);

    setMaxUnlockedStage(safeStage);

    await AsyncStorage.setItem(
      STORAGE_KEYS.MAX_UNLOCKED_STAGE,
      String(safeStage)
    );
  }

  function setupItems(targetStage: number) {
    setActiveItem(null);
    setShowItemSelect(false);

    const emptyItems = { delete: 0, pushDown: 0, pushRight: 0 };

    if (gameMode === GAME_MODE.PVP || gameMode === GAME_MODE.PVC) {
      setItems({
        red: normalizeItems(pvpItemsRef.current.red),
        yellow: normalizeItems(pvpItemsRef.current.yellow),
      });

      return;
    }

    const cpuItems = getCpuItemsByStage(targetStage);
    const playerRule = getPlayerItemsByStage(targetStage);

    if (playerRule.type === 'fixed') {
      setItems({
        red: normalizeItems(playerRule.items),
        yellow: normalizeItems(cpuItems),
      });

      return;
    }

    if (playerRule.type === 'select') {
      setShowItemSelect(true);

      setItemSelectRule({
        count: playerRule.count,
        allowDuplicate: playerRule.allowDuplicate,
      });

      setItems({
        red: emptyItems,
        yellow: normalizeItems(cpuItems),
      });

      return;
    }

    setItems({
      red: emptyItems,
      yellow: normalizeItems(cpuItems),
    });
  }

  function getWeightedRandomItem() {
    const rand = Math.random();

    if (rand < 0.2) return ITEM.DELETE;
    if (rand < 0.6) return ITEM.PUSH_RIGHT;
    return ITEM.PUSH_DOWN;
  }

  function getPlayerItemsByStage(stage: number) {
    if (stage <= 5) {
      return {
        type: 'fixed',
        items: { delete: 0, pushDown: 0, pushRight: 0 },
      };
    }

    if (stage <= 10) {
      return {
        type: 'fixed',
        items: { delete: 0, pushDown: 1, pushRight: 0 },
      };
    }

    if (stage <= 15) {
      return {
        type: 'fixed',
        items: { delete: 0, pushDown: 0, pushRight: 1 },
      };
    }

    if (stage <= 20) {
      return {
        type: 'fixed',
        items: { delete: 1, pushDown: 0, pushRight: 0 },
      };
    }

    if (stage <= 25) {
      return {
        type: 'select',
        count: 1,
        allowDuplicate: false,
      };
    }

    if (stage <= 30) {
      return {
        type: 'select',
        count: 2,
        allowDuplicate: false,
        sameOnly: true,
      };
    }

    if (stage <= 40) {
      return {
        type: 'select',
        count: 2,
        allowDuplicate: true,
      };
    }

    if (stage <= 50) {
      return {
        type: 'fixed',
        items: { delete: 1, pushDown: 1, pushRight: 1 },
      };
    }

    return {
      type: 'select',
      count: 3,
      allowDuplicate: true,
    };
  }

  function getCpuItemsByStage(stage: number) {
    const result = {
      delete: 0,
      pushDown: 0,
      pushRight: 0,
    };

    if (stage <= 30) {
      return result;
    }

    if (stage <= 40) {
      const item = getWeightedRandomItem();
      result[itemKey(item)] += 1;
      return result;
    }

    if (stage <= 50) {
      const picked = new Set();

      while (picked.size < 2) {
        picked.add(getWeightedRandomItem());
      }

      picked.forEach((item) => {
        result[itemKey(item)] += 1;
      });

      return result;
    }

    return {
      delete: 1,
      pushDown: 1,
      pushRight: 1,
    };
  }

  function itemKey(item) {
    if (item === ITEM.DELETE) return 'delete';
    if (item === ITEM.PUSH_DOWN) return 'pushDown';
    if (item === ITEM.PUSH_RIGHT) return 'pushRight';
  }

  function startStage(
    targetStage: number,
    unlockedOverride?: number,
    boardSizeOverride?: string
  ) {
    const unlocked = unlockedOverride ?? maxUnlockedStage;

    const safeStage =
      gameMode === GAME_MODE.STAGE
        ? Math.min(clampStage(targetStage), unlocked)
        : 1;

    const nextBoardSize = boardSizeOverride ?? boardSizeRef.current;

    setStage(safeStage);
    setBoardSize(nextBoardSize);
    boardSizeRef.current = nextBoardSize;

    setBoard(createSizedBoard(nextBoardSize));
    setPlayer(CELL.RED);
    setResult(RESULT.PLAYING);
    setWinningCells([]);
    setWinner(null);
    setLastMove(null);
    setIsCpuThinking(false);
    setActiveItem(null);
    setBoardEffectEvent(null);
    setItemSoundEvent(null);

    setupItems(safeStage);
  }

  function chooseStageItems(selectedItems) {
    setShowItemSelect(false);
    setActiveItem(null);

    const cpuItems = getCpuItemsByStage(stage);

    const nextItems = {
      delete: 0,
      pushDown: 0,
      pushRight: 0,
    };

    selectedItems.forEach((item) => {
      if (item === ITEM.DELETE) nextItems.delete += 1;
      if (item === ITEM.PUSH_DOWN) nextItems.pushDown += 1;
      if (item === ITEM.PUSH_RIGHT) nextItems.pushRight += 1;
    });

    setItems({
      red: nextItems,
      yellow: normalizeItems(cpuItems),
    });
  }

  function switchTurn() {
    setPlayer((prev) => (prev === CELL.RED ? CELL.YELLOW : CELL.RED));
    setActiveItem(null);
  }

  function unlockNextStageIfNeeded() {
    if (gameMode !== GAME_MODE.STAGE) return;

    const nextUnlockedStage = Math.min(
      MAX_STAGE,
      Math.max(maxUnlockedStage, stage + 1)
    );

    // 新規解放スキン確認
    const newlyUnlockedSkin = SKINS.find(
      (skin) =>
        skin.unlockStage === nextUnlockedStage &&
        skin.unlockStage > maxUnlockedStage
    );

    if (newlyUnlockedSkin) {
      setUnlockedSkin(newlyUnlockedSkin);
    }

    if (nextUnlockedStage > maxUnlockedStage) {
      saveUnlockedStage(nextUnlockedStage);
    }
  }

  function finishGame(cells, winningPlayer) {
    setWinningCells(cells);
    setWinner(winningPlayer);

    if (gameMode === GAME_MODE.PVP) {
      setResult(RESULT.WIN);
      return;
    }

    if (winningPlayer === CELL.RED) {
      setResult(RESULT.WIN);
      unlockNextStageIfNeeded();
    } else {
      setResult(RESULT.LOSE);
    }
  }

  function checkBoardAfterChange(newBoard) {
    const redWin = findAnyWin(newBoard, CELL.RED);

    if (redWin.length >= 4) {
      finishGame(redWin, CELL.RED);
      return true;
    }

    const yellowWin = findAnyWin(newBoard, CELL.YELLOW);

    if (yellowWin.length >= 4) {
      finishGame(yellowWin, CELL.YELLOW);
      return true;
    }

    if (isBoardFull(newBoard)) {
      setWinningCells([]);
      setWinner(null);
      setResult(RESULT.DRAW);
      return true;
    }

    return false;
  }

  function dropPiece(column: number) {
    if (!loaded) return false;
    if (result !== RESULT.PLAYING) return false;

    const dropResult = drop(board, column, player);

    if (!dropResult) return false;

    setLastMove({
      row: dropResult.row,
      column,
      player,
    });

    setBoard(dropResult.board);

    if (checkWin(dropResult.board, dropResult.row, column)) {
      const cells = getWinningCells(dropResult.board, dropResult.row, column);
      finishGame(cells, player);
      return true;
    }

    if (isBoardFull(dropResult.board)) {
      setWinningCells([]);
      setWinner(null);
      setResult(RESULT.DRAW);
      return true;
    }

    switchTurn();
    return true;
  }

  function applyItemResult(itemResult) {
    if (!itemResult) return false;

    setBoard(itemResult.board);
    setLastMove(null);
    setActiveItem(null);

    const ended = checkBoardAfterChange(itemResult.board);

    if (!ended) {
      switchTurn();
    }

    return true;
  }

  function canHumanOperate() {
    if (!loaded) return false;
    if (result !== RESULT.PLAYING) return false;

    if (
      (gameMode === GAME_MODE.STAGE || gameMode === GAME_MODE.PVC) &&
      player === CELL.YELLOW
    ) {
      return false;
    }

    return true;
  }

  function handleColumnPress(column: number) {
    if (!canHumanOperate()) return false;
    if (showItemSelect) return false;

    const key = player === CELL.RED ? 'red' : 'yellow';
    const current = items[key];

    if (!current) {
      console.warn('items broken', items);
      return false;
    }

    if (activeItem === ITEM.PUSH_DOWN) {
      if (current.pushDown <= 0) return false;

      const itemResult = pushColumnFromTop(board, column, player);
      if (!itemResult) return false;

      setItems((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          pushDown: Math.max(0, prev[key].pushDown - 1),
        },
      }));

      const crashCells = [];

      for (let r = 0; r < board.length; r++) {
        crashCells.push({ row: r, col: column });
      }

      notifyItemSound('crash');
      notifyBoardEffect('crash', crashCells);

      return applyItemResult(itemResult);
    }

    if (activeItem !== null) return false;

    return dropPiece(column);
  }

  function handleCellPress(row: number, column: number) {
    if (!canHumanOperate()) return false;
    if (showItemSelect) return false;

    const key = player === CELL.RED ? 'red' : 'yellow';
    const current = items[key];

    if (!current) {
      console.warn('items undefined', items);
      return false;
    }

    if (activeItem === ITEM.DELETE) {
      if (current.delete <= 0) return false;

      const itemResult = deletePiece(board, row, column, player);
      if (!itemResult) return false;

      setItems((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          delete: Math.max(0, prev[key].delete - 1),
        },
      }));

      notifyItemSound('delete');
      notifyBoardEffect('delete', [{ row, col: column }]);

      return applyItemResult(itemResult);
    }

    if (activeItem === ITEM.PUSH_RIGHT) {
      if (current.pushRight <= 0) return false;

      const itemResult = pushPieceRight(board, row, column, player);
      if (!itemResult) return false;

      setItems((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          pushRight: Math.max(0, prev[key].pushRight - 1),
        },
      }));

      notifyItemSound('push');

      const targetCol = Math.min(column + 1, board[0].length - 1);

      notifyBoardEffect('push', [
        {
          row,
          col: targetCol,
        },
      ]);

      return applyItemResult(itemResult);
    }

    return false;
  }

  useEffect(() => {
    if (!loaded) return;
    if (result !== RESULT.PLAYING) return;

    const shouldCpuMove =
      (gameMode === GAME_MODE.STAGE || gameMode === GAME_MODE.PVC) &&
      player === CELL.YELLOW;

    if (!shouldCpuMove) return;

    setIsCpuThinking(true);

    const timer = setTimeout(() => {
      const cpuLevel =
        gameMode === GAME_MODE.STAGE
          ? stageToCpuLevel(stage)
          : selectedCpuLevel;

      const cpuItems = items.yellow;
      const action = getCpuAction(board, cpuLevel, cpuItems);

      setIsCpuThinking(false);

      if (action.type === ITEM.DELETE) {
        const itemResult = deletePiece(
          board,
          action.row,
          action.column,
          CELL.YELLOW
        );

        if (!itemResult) return;

        setItems((prev) => ({
          ...prev,
          yellow: {
            ...prev.yellow,
            delete: Math.max(0, prev.yellow.delete - 1),
          },
        }));

        notifyItemSound('delete');
        notifyBoardEffect('delete', [
          {
            row: action.row,
            col: action.column,
          },
        ]);

        applyItemResult(itemResult);
        return;
      }

      if (action.type === ITEM.PUSH_RIGHT) {
        const itemResult = pushPieceRight(
          board,
          action.row,
          action.column,
          CELL.YELLOW
        );

        if (!itemResult) return;

        setItems((prev) => ({
          ...prev,
          yellow: {
            ...prev.yellow,
            pushRight: Math.max(0, prev.yellow.pushRight - 1),
          },
        }));

        notifyItemSound('push');

        const targetCol = Math.min(
          action.column + 1,
          board[0].length - 1
        );

        notifyBoardEffect('push', [
          {
            row: action.row,
            col: targetCol,
          },
        ]);

        applyItemResult(itemResult);
        return;
      }

      if (action.type === ITEM.PUSH_DOWN) {
        const itemResult = pushColumnFromTop(
          board,
          action.column,
          CELL.YELLOW
        );

        if (!itemResult) return;

        setItems((prev) => ({
          ...prev,
          yellow: {
            ...prev.yellow,
            pushDown: Math.max(0, prev.yellow.pushDown - 1),
          },
        }));

        const crashCells = [];

        for (let r = 0; r < board.length; r++) {
          crashCells.push({ row: r, col: action.column });
        }

        notifyItemSound('crash');
        notifyBoardEffect('crash', crashCells);

        applyItemResult(itemResult);
        return;
      }

      if (action.type === 'drop') {
        if (action.column !== -1) {
          dropPiece(action.column);
        }
      }
    }, config.cpuThinkingMs);

    return () => {
      clearTimeout(timer);
      setIsCpuThinking(false);
    };
  }, [
    loaded,
    player,
    board,
    result,
    stage,
    gameMode,
    selectedCpuLevel,
    items,
  ]);

  async function selectSkin(id: string) {
    setSelectedSkinId(id);
    await AsyncStorage.setItem(STORAGE_KEYS.SKIN, id);
  }

  async function selectBoardSize(size: string) {
    setBoardSize(size);
    boardSizeRef.current = size;

    await AsyncStorage.setItem(STORAGE_KEYS.BOARD_SIZE, size);
  }

  async function selectCpuLevel(level: number) {
    const safeLevel = clampCpuLevel(level);

    setSelectedCpuLevel(safeLevel);
    await AsyncStorage.setItem(STORAGE_KEYS.CPU_LEVEL, String(safeLevel));
  }

  function resetStage() {
    startStage(stage, maxUnlockedStage, boardSizeRef.current);
  }

  function goNextStage() {
    if (gameMode !== GAME_MODE.STAGE) {
      resetStage();
      return;
    }

    const nextStage = getNextStage(stage);
    startStage(nextStage, maxUnlockedStage, boardSizeRef.current);
  }

  function goPrevStage() {
    if (gameMode !== GAME_MODE.STAGE) {
      resetStage();
      return;
    }

    const prevStage = getPrevStage(stage);
    startStage(prevStage, maxUnlockedStage, boardSizeRef.current);
  }

  async function resetProgress() {
    await AsyncStorage.setItem(STORAGE_KEYS.MAX_UNLOCKED_STAGE, '1');

    setMaxUnlockedStage(1);
    startStage(1, 1, boardSizeRef.current);
  }

  return {
    loaded,

    gameMode,

    board,
    boardSize,
    selectBoardSize,
    reloadSettings,

    player,
    result,
    winner,
    winningCells,
    lastMove,
    isCpuThinking,

    stage,
    maxUnlockedStage,
    maxStage: MAX_STAGE,
    stageLevel:
      gameMode === GAME_MODE.STAGE
        ? config.levelLabel
        : selectedCpuLevel === 11
          ? '神'
          : `レベル ${selectedCpuLevel}`,

    items,
    activeItem,
    setActiveItem,

    showItemSelect,
    itemSelectRule,
    chooseStageItems,

    handleCellPress,
    handleColumnPress,

    selectedSkin: getSkinById(selectedSkinId),
    selectedSkinId,
    unlockedSkins: getUnlockedSkins(maxUnlockedStage),
    selectSkin,

    selectedCpuLevel,
    selectCpuLevel,
    stageCpuLevel: stageToCpuLevel(stage),

    startStage,
    resetStage,
    goNextStage,
    goPrevStage,
    resetProgress,

    itemSoundEvent,
    boardEffectEvent,
    unlockedSkin,
    setUnlockedSkin,
  };
}