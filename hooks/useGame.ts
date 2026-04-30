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

export const STORAGE_KEYS = {
  MAX_UNLOCKED_STAGE: 'maxUnlockedStage',
  SKIN: 'skin',
  BOARD_SIZE: 'boardSize',
};

export function useGame(initialStage = 1) {
  const [boardSize, setBoardSize] = useState('6x7');
  const [board, setBoard] = useState(createSizedBoard('6x7'));

  const [player, setPlayer] = useState(CELL.RED);
  const [result, setResult] = useState(RESULT.PLAYING);
  const [winningCells, setWinningCells] = useState([]);
  const [lastMove, setLastMove] = useState(null);

  const [stage, setStage] = useState(clampStage(Number(initialStage || 1)));
  const [maxUnlockedStage, setMaxUnlockedStage] = useState(1);
  const [loaded, setLoaded] = useState(false);

  const [activeItem, setActiveItem] = useState(null);
  const [deleteLeft, setDeleteLeft] = useState(0);
  const [pushDownLeft, setPushDownLeft] = useState(0);
  const [pushRightLeft, setPushRightLeft] = useState(0);
  const [showItemSelect, setShowItemSelect] = useState(false);

  const [selectedSkinId, setSelectedSkinId] = useState('normal');
  const [isCpuThinking, setIsCpuThinking] = useState(false);

  const config = getStageConfig(stage);
  const boardSizeRef = useRef('6x7');

  useEffect(() => {
    loadProgress();
  }, []);

  useEffect(() => {
    if (!loaded) return;

    const requestedStage = clampStage(Number(initialStage || 1));
    const playableStage = Math.min(requestedStage, maxUnlockedStage);

    if (playableStage !== stage) {
      startStage(playableStage, maxUnlockedStage, boardSize);
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

    const unlocked = savedStage ? clampStage(Number(savedStage)) : 1;
    const requestedStage = clampStage(Number(initialStage || 1));
    const playableStage = Math.min(requestedStage, unlocked);
    const nextBoardSize = savedBoardSize || '6x7';

    setMaxUnlockedStage(unlocked);
    setBoardSize(nextBoardSize);
    boardSizeRef.current = nextBoardSize;
    setSelectedSkinId(savedSkin || 'normal');

    startStage(playableStage, unlocked, nextBoardSize);
    setLoaded(true);
  }

  async function reloadSettings() {
    const savedStage = await AsyncStorage.getItem(
      STORAGE_KEYS.MAX_UNLOCKED_STAGE
    );
    const savedSkin = await AsyncStorage.getItem(STORAGE_KEYS.SKIN);
    const savedBoardSize = await AsyncStorage.getItem(STORAGE_KEYS.BOARD_SIZE);

    const nextUnlockedStage = savedStage
      ? clampStage(Number(savedStage))
      : 1;

    const nextSkinId = savedSkin || 'normal';
    const nextBoardSize = savedBoardSize || '6x7';
    const progressChanged = nextUnlockedStage !== maxUnlockedStage;
    const currentStageLocked = stage > nextUnlockedStage;
    const previousBoardSize = boardSizeRef.current;
    const boardSizeChanged = nextBoardSize !== previousBoardSize;
    
    setSelectedSkinId(nextSkinId);
    setMaxUnlockedStage(nextUnlockedStage);

    if (boardSizeChanged) {
      setBoardSize(nextBoardSize);
     }

    if (boardSizeChanged || currentStageLocked) {
      const nextStage = currentStageLocked
        ? 1
        : Math.min(stage, nextUnlockedStage);

      boardSizeRef.current = nextBoardSize;
      setBoardSize(nextBoardSize);
      startStage(nextStage, nextUnlockedStage, nextBoardSize);
      return;
    }

    if (progressChanged) {
      setMaxUnlockedStage(nextUnlockedStage);
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
    const stageConfig = getStageConfig(targetStage);

    setActiveItem(null);

    if (stageConfig.itemRule === 'select_one') {
      setShowItemSelect(true);
      setDeleteLeft(0);
      setPushDownLeft(0);
      setPushRightLeft(0);
      return;
    }

    setShowItemSelect(false);
    setDeleteLeft(stageConfig.unlockedItems.includes(ITEM.DELETE) ? 1 : 0);
    setPushDownLeft(
      stageConfig.unlockedItems.includes(ITEM.PUSH_DOWN) ? 1 : 0
    );
    setPushRightLeft(
      stageConfig.unlockedItems.includes(ITEM.PUSH_RIGHT) ? 1 : 0
    );
  }

  function startStage(
    targetStage: number,
    unlockedOverride?: number,
    boardSizeOverride?: string
  ) {
    const unlocked = unlockedOverride ?? maxUnlockedStage;
    const safeStage = Math.min(clampStage(targetStage), unlocked);
    const nextBoardSize = boardSizeOverride ?? boardSizeRef.current;

    setBoardSize(nextBoardSize);
    boardSizeRef.current = nextBoardSize;

    setBoard(createSizedBoard(nextBoardSize));
    setStage(safeStage);
    setPlayer(CELL.RED);
    setResult(RESULT.PLAYING);
    setWinningCells([]);
    setLastMove(null);
    setIsCpuThinking(false);

    setupItems(safeStage);
  }

  function chooseStageItem(item) {
    setShowItemSelect(false);
    setActiveItem(null);

    setDeleteLeft(item === ITEM.DELETE ? 2 : 0);
    setPushDownLeft(item === ITEM.PUSH_DOWN ? 2 : 0);
    setPushRightLeft(item === ITEM.PUSH_RIGHT ? 2 : 0);
  }

  function switchTurn() {
    setPlayer((prev) => (prev === CELL.RED ? CELL.YELLOW : CELL.RED));
  }

  function unlockNextStageIfNeeded() {
    const nextUnlockedStage = Math.min(
      MAX_STAGE,
      Math.max(maxUnlockedStage, stage + 1)
    );

    if (nextUnlockedStage > maxUnlockedStage) {
      saveUnlockedStage(nextUnlockedStage);
    }
  }

  function finishAsWin(cells) {
    setWinningCells(cells);
    setResult(RESULT.WIN);
    unlockNextStageIfNeeded();
  }

  function finishAsLose(cells) {
    setWinningCells(cells);
    setResult(RESULT.LOSE);
  }

  function checkBoardAfterChange(newBoard) {
    const redWin = findAnyWin(newBoard, CELL.RED);

    if (redWin.length >= 4) {
      finishAsWin(redWin);
      return true;
    }

    const yellowWin = findAnyWin(newBoard, CELL.YELLOW);

    if (yellowWin.length >= 4) {
      finishAsLose(yellowWin);
      return true;
    }

    if (isBoardFull(newBoard)) {
      setWinningCells([]);
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

      if (player === CELL.RED) {
        finishAsWin(cells);
      } else {
        finishAsLose(cells);
      }

      return true;
    }

    if (isBoardFull(dropResult.board)) {
      setWinningCells([]);
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

  function handleColumnPress(column: number) {
    if (!loaded) return false;
    if (player !== CELL.RED) return false;
    if (result !== RESULT.PLAYING) return false;

    if (activeItem === ITEM.PUSH_DOWN) {
      const itemResult = pushColumnFromTop(board, column);

      if (!itemResult) return false;

      setPushDownLeft((value) => Math.max(0, value - 1));

      return applyItemResult(itemResult);
    }

    if (activeItem !== ITEM.NONE && activeItem !== null) {
      return false;
    }

    return dropPiece(column);
  }

  function handleCellPress(row: number, column: number) {
    if (!loaded) return false;
    if (player !== CELL.RED) return false;
    if (result !== RESULT.PLAYING) return false;

    if (activeItem === ITEM.DELETE) {
      const itemResult = deletePiece(board, row, column);

      if (!itemResult) return false;

      setDeleteLeft((value) => Math.max(0, value - 1));

      return applyItemResult(itemResult);
    }

    if (activeItem === ITEM.PUSH_RIGHT) {
      const itemResult = pushPieceRight(board, row, column);

      if (!itemResult) return false;

      setPushRightLeft((value) => Math.max(0, value - 1));

      return applyItemResult(itemResult);
    }

    return false;
  }

  useEffect(() => {
    if (!loaded) return;
    if (player !== CELL.YELLOW) return;
    if (result !== RESULT.PLAYING) return;

    setIsCpuThinking(true);

    const timer = setTimeout(() => {
      const move = getCpuMove(board, config);

      setIsCpuThinking(false);

      if (move.column !== -1) {
        dropPiece(move.column);
      }
    }, config.cpuThinkingMs);

    return () => {
      clearTimeout(timer);
      setIsCpuThinking(false);
    };
  }, [loaded, player, board, result, stage]);

  async function selectSkin(id: string) {
    setSelectedSkinId(id);
    await AsyncStorage.setItem(STORAGE_KEYS.SKIN, id);
  }

  async function selectBoardSize(size: string) {
    setBoardSize(size);
    await AsyncStorage.setItem(STORAGE_KEYS.BOARD_SIZE, size);
    startStage(stage, maxUnlockedStage, size);
  }

  function resetStage() {
    startStage(stage, maxUnlockedStage, boardSize);
  }

  function goNextStage() {
    const nextStage = getNextStage(stage);
    startStage(nextStage, maxUnlockedStage, boardSize);
  }

  function goPrevStage() {
    const prevStage = getPrevStage(stage);
    startStage(prevStage, maxUnlockedStage, boardSize);
  }

  async function resetProgress() {
    await AsyncStorage.removeItem(STORAGE_KEYS.MAX_UNLOCKED_STAGE);

    setMaxUnlockedStage(1);
    startStage(1, 1, boardSize);
  }

  return {
    loaded,

    board,
    boardSize,
    selectBoardSize,
    reloadSettings,

    player,
    result,
    winningCells,
    lastMove,
    isCpuThinking,

    stage,
    maxUnlockedStage,
    maxStage: MAX_STAGE,
    stageLevel: config.levelLabel,

    activeItem,
    setActiveItem,

    deleteLeft,
    pushDownLeft,
    pushRightLeft,

    showItemSelect,
    chooseStageItem,

    handleCellPress,
    handleColumnPress,

    selectedSkin: getSkinById(selectedSkinId),
    selectedSkinId,
    unlockedSkins: getUnlockedSkins(maxUnlockedStage),
    selectSkin,

    startStage,
    resetStage,
    goNextStage,
    goPrevStage,
    resetProgress,
  };
}