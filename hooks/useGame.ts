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

import { getCpuMove } from '../logic/cpu';

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

import { getSkinById, getUnlockedSkins } from '../logic/skins';

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
  return Math.min(10, Math.max(1, level));
}

function normalizeMode(mode: string) {
  if (mode === GAME_MODE.PVC) return GAME_MODE.PVC;
  if (mode === GAME_MODE.PVP) return GAME_MODE.PVP;
  return GAME_MODE.STAGE;
}

export function useGame(initialStage = 1, mode = GAME_MODE.STAGE) {
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
  const [items, setItems] = useState({
    red: { delete: 0, pushDown: 0, pushRight: 0 },
    yellow: { delete: 0, pushDown: 0, pushRight: 0 },
  });
  const [showItemSelect, setShowItemSelect] = useState(false);

  const [selectedSkinId, setSelectedSkinId] = useState('normal');
  const [selectedCpuLevel, setSelectedCpuLevel] = useState(5);
  const [isCpuThinking, setIsCpuThinking] = useState(false);

  const config = getStageConfig(stage);
  const key = player === CELL.RED ? 'red' : 'yellow';

  useEffect(() => {
    loadProgress();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (gameMode !== GAME_MODE.STAGE) return;

    const requestedStage = clampStage(Number(initialStage || 1));
    const playableStage = Math.min(requestedStage, maxUnlockedStage);

    if (playableStage !== stage) {
      startStage(playableStage, maxUnlockedStage, boardSizeRef.current);
    }
  }, [initialStage, loaded]);

  function createSizedBoard(size: string) {
    const parsed = parseBoardSize(size);
    return createBoard(parsed.rows, parsed.columns);
  }

  async function loadProgress() {
    const savedStage = await AsyncStorage.getItem(
      STORAGE_KEYS.MAX_UNLOCKED_STAGE
    );
    const savedSkin = await AsyncStorage.getItem(STORAGE_KEYS.SKIN);
    const savedBoardSize = await AsyncStorage.getItem(STORAGE_KEYS.BOARD_SIZE);
    const savedCpuLevel = await AsyncStorage.getItem(STORAGE_KEYS.CPU_LEVEL);

    const unlocked = savedStage ? clampStage(Number(savedStage)) : 1;
    const requestedStage = clampStage(Number(initialStage || 1));
    const playableStage =
      gameMode === GAME_MODE.STAGE
        ? Math.min(requestedStage, unlocked)
        : 1;

    const nextBoardSize = savedBoardSize || '6x7';
    const nextCpuLevel = savedCpuLevel
      ? clampCpuLevel(Number(savedCpuLevel))
      : 5;

    setMaxUnlockedStage(unlocked);
    setBoardSize(nextBoardSize);
    boardSizeRef.current = nextBoardSize;

    setSelectedSkinId(savedSkin || 'normal');
    setSelectedCpuLevel(nextCpuLevel);

    startStage(playableStage, unlocked, nextBoardSize);
    setLoaded(true);
  }

  async function reloadSettings() {
    const savedStage = await AsyncStorage.getItem(
      STORAGE_KEYS.MAX_UNLOCKED_STAGE
    );
    const savedSkin = await AsyncStorage.getItem(STORAGE_KEYS.SKIN);
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

    const boardSizeChanged = nextBoardSize !== boardSizeRef.current;
    const skinChanged = nextSkinId !== selectedSkinId;
    const cpuLevelChanged = nextCpuLevel !== selectedCpuLevel;
    const currentStageLocked =
      gameMode === GAME_MODE.STAGE && stage > nextUnlockedStage;

    setSelectedSkinId(nextSkinId);
    setSelectedCpuLevel(nextCpuLevel);
    setMaxUnlockedStage(nextUnlockedStage);

    if (boardSizeChanged) {
      setBoardSize(nextBoardSize);
      boardSizeRef.current = nextBoardSize;
    }

    if (boardSizeChanged || skinChanged || cpuLevelChanged || currentStageLocked) {
      const nextStage =
        gameMode === GAME_MODE.STAGE
          ? currentStageLocked
            ? 1
            : Math.min(stage, nextUnlockedStage)
          : 1;

      startStage(nextStage, nextUnlockedStage, nextBoardSize);
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

    // 対戦モードではステージ設定を使わない
    if (gameMode !== GAME_MODE.STAGE) {
        setShowItemSelect(false);

        setItems({
        red: {
            delete: 0,
            pushDown: 0,
            pushRight: 0,
        },
        yellow: {
            delete: 0,
            pushDown: 0,
            pushRight: 0,
        },
        });

        return;
    }

    const stageConfig = getStageConfig(targetStage);

    if (!stageConfig) {
        setShowItemSelect(false);

        setItems({
        red: {
            delete: 0,
            pushDown: 0,
            pushRight: 0,
        },
        yellow: {
            delete: 0,
            pushDown: 0,
            pushRight: 0,
        },
        });

        return;
    }

    if (stageConfig.itemRule === 'select_one') {
        setShowItemSelect(true);

        setItems({
        red: {
            delete: 0,
            pushDown: 0,
            pushRight: 0,
        },
        yellow: {
            delete: 0,
            pushDown: 0,
            pushRight: 0,
        },
        });

        return;
    }

    setShowItemSelect(false);

    setItems({
        red: {
        delete: stageConfig.unlockedItems.includes(ITEM.DELETE) ? 1 : 0,
        pushDown: stageConfig.unlockedItems.includes(ITEM.PUSH_DOWN) ? 1 : 0,
        pushRight: stageConfig.unlockedItems.includes(ITEM.PUSH_RIGHT) ? 1 : 0,
        },
        yellow: {
        delete: 0,
        pushDown: 0,
        pushRight: 0,
        },
    });
  }

  function getCurrentItems() {
    return player === CELL.RED ? items.red : items.yellow;
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

    setupItems(safeStage);
  }

  function chooseStageItem(item) {
    setShowItemSelect(false);
    setActiveItem(null);

    setItems({
    red: {
        delete: item === ITEM.DELETE ? 2 : 0,
        pushDown: item === ITEM.PUSH_DOWN ? 2 : 0,
        pushRight: item === ITEM.PUSH_RIGHT ? 2 : 0,
    },
    yellow: {
        delete: 0,
        pushDown: 0,
        pushRight: 0,
    },
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

    if (gameMode === GAME_MODE.STAGE && player === CELL.YELLOW) {
         return false;
    }

    return true;
    }

    function handleColumnPress(column: number) {
    if (!canHumanOperate()) return false;

    const current = getCurrentItems();
    
    if (activeItem === ITEM.PUSH_DOWN) {
        if (current.pushDown <= 0) return false;

        const itemResult = pushColumnFromTop(board, column);

        if (!itemResult) return false;

        const key = player === CELL.RED ? 'red' : 'yellow';

        setItems(prev => ({
            ...prev,
            [key]: {
            ...prev[key],
            pushDown: Math.max(0, prev[key].pushDown - 1),
            },
        }));
        return applyItemResult(itemResult);
    }

    if (activeItem !== null) {
        return false;
    }

    return dropPiece(column);
    }

  function handleCellPress(row: number, column: number) {
    if (!canHumanOperate()) return false;

    if (activeItem === ITEM.DELETE) {
        if (current.delete <= 0) return false;

        const itemResult = deletePiece(board, row, column);

        if (!itemResult) return false;

        const key = player === CELL.RED ? 'red' : 'yellow';

        setItems(prev => ({
            ...prev,
            [key]: {
            ...prev[key],
            delete: Math.max(0, prev[key].delete - 1),
            },
        }));
        return applyItemResult(itemResult);
    }

    if (activeItem === ITEM.PUSH_RIGHT) {
         if (current.pushRight <= 0) return false;

        const itemResult = pushPieceRight(board, row, column);

        if (!itemResult) return false;

        const key = player === CELL.RED ? 'red' : 'yellow';

        setItems(prev => ({
            ...prev,
            [key]: {
            ...prev[key],
            pushRight: Math.max(0, prev[key].pushRight - 1),
            },
        }));

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

      const move = getCpuMove(board, cpuLevel);

      setIsCpuThinking(false);

      if (move.column !== -1) {
        dropPiece(move.column);
      }
    }, config.cpuThinkingMs);

    return () => {
      clearTimeout(timer);
      setIsCpuThinking(false);
    };
  }, [loaded, player, board, result, stage, gameMode, selectedCpuLevel]);

  async function selectSkin(id: string) {
    setSelectedSkinId(id);
    await AsyncStorage.setItem(STORAGE_KEYS.SKIN, id);
  }

  async function selectBoardSize(size: string) {
    setBoardSize(size);
    boardSizeRef.current = size;

    await AsyncStorage.setItem(STORAGE_KEYS.BOARD_SIZE, size);
    startStage(stage, maxUnlockedStage, size);
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
    stageLevel: config.levelLabel,

    items,
    activeItem,
    setActiveItem,

    showItemSelect,
    chooseStageItem,

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
  };
}