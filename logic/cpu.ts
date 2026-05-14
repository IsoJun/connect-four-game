import {
  Board,
  CELL,
  CellValue,
  getBoardColumns,
  getBoardRows,
  getValidColumns,
  simulateMove,
  checkWin,
  findAnyWin,
  isBoardFull,
} from './gameLogic';

import {
  ITEM,
  deletePiece,
  pushPieceRight,
  pushColumnFromTop,
} from './items';

const CPU = CELL.YELLOW;
const PLAYER = CELL.RED;
const CONNECT = 4;

// =========================
// 🎯 レベル設定
// =========================
export function getCpuLevelConfig(
  level: number,
  rows: number,
  columns: number
) {
  const cells = rows * columns;
  const safeLevel = Math.max(1, Math.min(11, level));

  const depth =
    safeLevel === 11 ? 7 :
    safeLevel <= 2 ? 1 :
    safeLevel <= 5 ? 2 :
    safeLevel <= 8 ? 3 :
    4;

const pieceCountFactor = cells >= 100 ? 4 : 5;

const adjustedDepth =
  safeLevel === 11
    ? cells >= 100
      ? 5
      : cells >= 64
        ? 6
        : 7
    : cells >= 100
      ? Math.min(depth, 3)
      : cells >= 64
        ? Math.min(depth, 4)
        : depth;

  const mistakeRate =
    safeLevel === 11 ? 0 :
    safeLevel <= 2 ? 0.45 :
    safeLevel <= 4 ? 0.28 :
    safeLevel <= 6 ? 0.14 :
    safeLevel <= 8 ? 0.06 :
    0.01;

  const defenseWeight =
    safeLevel === 11 ? 3.0 :
    safeLevel <= 3 ? 0.8 :
    safeLevel <= 6 ? 1.0 :
    safeLevel <= 8 ? 1.15 :
    1.3;

  const attackWeight =
    safeLevel === 11 ? 2.4 :
    safeLevel <= 3 ? 0.85 :
    safeLevel <= 6 ? 1.0 :
    safeLevel <= 8 ? 1.15 :
    1.25;

  const itemUseRate =
    safeLevel === 11 ? 1.0 :
    safeLevel <= 3 ? 0.15 :
    safeLevel <= 6 ? 0.35 :
    safeLevel <= 8 ? 0.55 :
    0.7;

  const itemScoreThreshold =
    safeLevel === 11 ? 15 :
    safeLevel <= 3 ? 120 :
    safeLevel <= 6 ? 80 :
    safeLevel <= 8 ? 50 :
    30;

  return {
    level: safeLevel,
    depth: adjustedDepth,
    mistakeRate,
    defenseWeight,
    attackWeight,
    itemUseRate,
    itemScoreThreshold,
    avoidGivingImmediateWin: safeLevel >= 7,
    preferDoubleThreat: safeLevel >= 9,
    godMode: safeLevel === 11,
  };
}

// =========================
// 🎯 評価関数
// =========================
function evaluateWindow(
  window: CellValue[],
  attackWeight: number,
  defenseWeight: number
) {
  const cpuCount = window.filter((v) => v === CPU).length;
  const playerCount = window.filter((v) => v === PLAYER).length;
  const emptyCount = window.filter((v) => v === CELL.EMPTY).length;

  if (cpuCount === 4) return 1000000;
  if (playerCount === 4) return -1000000;

  let score = 0;

  if (cpuCount === 3 && emptyCount === 1) score += 900 * attackWeight;
  if (cpuCount === 2 && emptyCount === 2) score += 90 * attackWeight;
  if (cpuCount === 1 && emptyCount === 3) score += 10 * attackWeight;

  if (playerCount === 3 && emptyCount === 1) score -= 1400 * defenseWeight;
  if (playerCount === 2 && emptyCount === 2) score -= 130 * defenseWeight;
  if (playerCount === 1 && emptyCount === 3) score -= 12 * defenseWeight;

  return score;
}

function evaluateBoard(
  board: Board,
  attackWeight = 1,
  defenseWeight = 1
) {
  const rows = getBoardRows(board);
  const columns = getBoardColumns(board);

  let score = 0;
  const center = Math.floor(columns / 2);

  for (let r = 0; r < rows; r++) {
    if (board[r][center] === CPU) score += 8;
    if (board[r][center] === PLAYER) score -= 8;

    if (columns % 2 === 0) {
      const center2 = center - 1;
      if (board[r][center2] === CPU) score += 5;
      if (board[r][center2] === PLAYER) score -= 5;
    }
  }

  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      for (const [dr, dc] of directions) {
        const window: CellValue[] = [];

        for (let i = 0; i < CONNECT; i++) {
          const rr = r + dr * i;
          const cc = c + dc * i;

          if (rr < 0 || rr >= rows || cc < 0 || cc >= columns) break;

          window.push(board[rr][cc]);
        }

        if (window.length === CONNECT) {
          score += evaluateWindow(window, attackWeight, defenseWeight);
        }
      }
    }
  }

  score += countImmediateWinningMoves(board, CPU) * 320 * attackWeight;
  score -= countImmediateWinningMoves(board, PLAYER) * 520 * defenseWeight;

  return score;
}

// =========================
// 🎯 ミニマックス
// =========================
function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  attackWeight: number,
  defenseWeight: number
): number {
  if (findAnyWin(board, CPU).length >= 4) return 1000000 + depth;
  if (findAnyWin(board, PLAYER).length >= 4) return -1000000 - depth;

  if (depth === 0 || isBoardFull(board)) {
    return evaluateBoard(board, attackWeight, defenseWeight);
  }

  const validColumns = orderColumnsByCenter(board, getValidColumns(board));

  if (maximizing) {
    let value = -Infinity;

    for (const column of validColumns) {
      const sim = simulateMove(board, column, CPU);
      if (!sim) continue;

      value = Math.max(
        value,
        minimax(
          sim.board,
          depth - 1,
          alpha,
          beta,
          false,
          attackWeight,
          defenseWeight
        )
      );

      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }

    return value;
  }

  let value = Infinity;

  for (const column of validColumns) {
    const sim = simulateMove(board, column, PLAYER);
    if (!sim) continue;

    value = Math.min(
      value,
      minimax(
        sim.board,
        depth - 1,
        alpha,
        beta,
        true,
        attackWeight,
        defenseWeight
      )
    );

    beta = Math.min(beta, value);
    if (alpha >= beta) break;
  }

  return value;
}

// =========================
// 🎯 通常CPU手
// =========================
export function getCpuMove(board: Board, cpuLevel: number) {
  const rows = getBoardRows(board);
  const columns = getBoardColumns(board);

  const config = getCpuLevelConfig(cpuLevel, rows, columns);
  const validColumns = orderColumnsByCenter(board, getValidColumns(board));

  if (validColumns.length === 0) {
    return { column: -1 };
  }

  if (Math.random() < config.mistakeRate) {
    return {
      column: validColumns[Math.floor(Math.random() * validColumns.length)],
    };
  }

  const winMove = findImmediateMove(board, CPU);
  if (winMove !== -1) return { column: winMove };

  const blockMove = findImmediateMove(board, PLAYER);
  if (blockMove !== -1) return { column: blockMove };

  if (config.godMode) {
    const doubleThreatMove = findMoveCreatingDoubleThreat(board, CPU);
    if (doubleThreatMove !== -1) {
      return { column: doubleThreatMove };
    }

    const blockDoubleThreatMove = findMoveReducingPlayerDoubleThreat(board);
    if (blockDoubleThreatMove !== -1) {
      return { column: blockDoubleThreatMove };
    }
  }

  let bestScore = -Infinity;
  let bestCols: number[] = [];

  for (const col of validColumns) {
    const sim = simulateMove(board, col, CPU);
    if (!sim) continue;

    if (
      config.avoidGivingImmediateWin &&
      hasImmediateWinningMove(sim.board, PLAYER)
    ) {
      continue;
    }

    const searchDepth = config.godMode
      ? getGodSearchDepth(board, config.depth)
      : config.depth;

    const score = minimax(
      sim.board,
      searchDepth - 1,
      -Infinity,
      Infinity,
      false,
      config.attackWeight,
      config.defenseWeight
    );

    if (score > bestScore) {
      bestScore = score;
      bestCols = [col];
    } else if (score === bestScore) {
      bestCols.push(col);
    }
  }

  if (bestCols.length === 0) {
    return {
      column: validColumns[0],
    };
  }

  if (config.godMode) {
    return {
      column: orderColumnsByCenter(board, bestCols)[0],
    };
  }

  return {
    column: bestCols[Math.floor(Math.random() * bestCols.length)],
  };
}

// =========================
// 🎯 CPUアクション
// =========================
export function getCpuAction(board: Board, cpuLevel: number, cpuItems: any) {
  const rows = getBoardRows(board);
  const columns = getBoardColumns(board);
  const config = getCpuLevelConfig(cpuLevel, rows, columns);

  const pieceCount = countPieces(board);
  const isEarlyGame = pieceCount < 10;
  const playerThreatCount = countImmediateWinningMoves(board, PLAYER);

  // ① 普通に置いて勝てるなら、アイテムより優先して勝つ
  const winMove = findImmediateMove(board, CPU);
  if (winMove !== -1) {
    return { type: 'drop', column: winMove };
  }

  // ② 神レベル：アイテムで即勝てるなら必ず使う
  if (config.godMode) {
    const winningItemAction = findBestCpuItemAction(board, cpuItems, config, {
      mode: 'immediateWinOnly',
      isEarlyGame,
    });

    if (winningItemAction) {
      return winningItemAction;
    }
  }

  // ③ 神レベル：相手の即勝ちが複数あるなら、通常手では防ぎきれないので先にアイテム防御
  if (config.godMode && playerThreatCount >= 2) {
    const defensiveItemAction = findBestCpuItemAction(board, cpuItems, config, {
      mode: 'defenseOnly',
      isEarlyGame,
    });

    if (defensiveItemAction) {
      return defensiveItemAction;
    }
  }

  // ④ 相手の即勝ちが1つなら、まず普通に置いて防ぐ
  const blockMove = findImmediateMove(board, PLAYER);
  if (blockMove !== -1) {
    return { type: 'drop', column: blockMove };
  }

  // ⑤ 神レベル：通常手で防げない危険だけアイテム防御
  if (config.godMode && playerThreatCount > 0) {
    const defensiveItemAction = findBestCpuItemAction(board, cpuItems, config, {
      mode: 'defenseOnly',
      isEarlyGame,
    });

    if (defensiveItemAction) {
      return defensiveItemAction;
    }
  }

  // ⑥ 神レベル：序盤は即勝ち・防御以外ではアイテムを使わない
  if (config.godMode) {
    if (!isEarlyGame) {
      const strategicItemAction = findBestCpuItemAction(board, cpuItems, config, {
        mode: 'strategic',
        isEarlyGame,
      });

      if (strategicItemAction) {
        return strategicItemAction;
      }
    }
  } else {
    if (Math.random() < config.itemUseRate) {
      const itemAction = findBestCpuItemAction(board, cpuItems, config, {
        mode: 'normal',
        isEarlyGame,
      });

      if (itemAction) {
        return itemAction;
      }
    }
  }

  const move = getCpuMove(board, cpuLevel);

  return {
    type: 'drop',
    column: move.column,
  };
}

// =========================
// 🎯 アイテム判断
// =========================
function findBestCpuItemAction(
  board: Board,
  cpuItems: any,
  config: any,
  options: {
    mode: 'normal' | 'immediateWinOnly' | 'defenseOnly' | 'strategic';
    isEarlyGame: boolean;
  }
) {
  const candidates = getItemCandidates(board, cpuItems, config);

  if (candidates.length === 0) return null;

  // ① アイテムで即勝利できるなら最優先
  let bestImmediateWin = null;
  let bestImmediateWinScore = -Infinity;

  for (const action of candidates) {
    if (findAnyWin(action.board, CPU).length >= 4) {
      const score = evaluateBoard(
        action.board,
        config.attackWeight,
        config.defenseWeight
      );

      if (score > bestImmediateWinScore) {
        bestImmediateWinScore = score;
        bestImmediateWin = action;
      }
    }
  }

  if (bestImmediateWin) return bestImmediateWin;

  if (options.mode === 'immediateWinOnly') return null;

 const playerThreatBefore = countImmediateWinningMoves(board, PLAYER);

  // defenseOnly なのに防御すべき脅威が無いなら、絶対にアイテムを使わない
  if (options.mode === 'defenseOnly' && playerThreatBefore === 0) {
    return null;
  }

  // ② 相手の即勝ちがある場合だけ、防御アイテムを探す
  if (playerThreatBefore > 0) {
    let bestDefenseAction = null;
    let bestDefenseScore = -Infinity;

    for (const action of candidates) {
      const playerThreatAfter = countImmediateWinningMoves(
        action.board,
        PLAYER
      );

      // 相手の即勝ち数を減らせないアイテムは使わない
      if (playerThreatAfter >= playerThreatBefore) {
        continue;
      }

      // 神レベルでは、相手の即勝ちが1つでも残るアイテムは原則使わない
      if (config.godMode && playerThreatAfter > 0) {
        continue;
      }

      const cpuThreatAfter = countImmediateWinningMoves(action.board, CPU);

      const score =
        evaluateAfterItem(action.board, config) +
        cpuThreatAfter * 900 -
        playerThreatAfter * 1600 +
        action.itemWeight;

      if (score > bestDefenseScore) {
        bestDefenseScore = score;
        bestDefenseAction = action;
      }
    }

    if (bestDefenseAction) return bestDefenseAction;

    if (options.mode === 'defenseOnly') return null;
  }

  if (options.mode === 'defenseOnly') return null;

  // ③ 序盤は神レベルでも戦略アイテムを使わない
  if (config.godMode && options.isEarlyGame) {
    return null;
  }

  const beforeScore = evaluateBoard(
    board,
    config.attackWeight,
    config.defenseWeight
  );

  let bestAction = null;
  let bestGain = -Infinity;

  for (const action of candidates) {
    const playerThreatAfter = countImmediateWinningMoves(action.board, PLAYER);

    // 神レベルでは、相手の即勝ちを1つでも残すアイテムは使わない
    if (config.godMode && playerThreatAfter > 0) {
      continue;
    }

    if (
      config.avoidGivingImmediateWin &&
      playerThreatAfter > 0
    ) {
      continue;
    }

    const afterScore = evaluateAfterItem(action.board, config);

    const cpuThreatAfter = countImmediateWinningMoves(action.board, CPU);
    const playerThreatBefore2 = countImmediateWinningMoves(board, PLAYER);

    const doubleThreatBonus =
      cpuThreatAfter >= 2 ? 950 : 0;

    const defenseBonus =
      playerThreatBefore2 > 0 && playerThreatAfter === 0 ? 1200 : 0;

    const threatBonus =
      cpuThreatAfter * 620 -
      playerThreatAfter * 1200;

    const gain =
      afterScore -
      beforeScore +
      threatBonus +
      doubleThreatBonus +
      defenseBonus +
      action.itemWeight;

    if (gain > bestGain) {
      bestGain = gain;
      bestAction = action;
    }
  }

  if (bestAction && bestGain >= config.itemScoreThreshold) {
    return bestAction;
  }

  return null;
}

function getItemCandidates(board: Board, cpuItems: any, config: any) {
  const candidates: any[] = [];
  const rows = getBoardRows(board);
  const columns = getBoardColumns(board);

  if (cpuItems?.delete > 0) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        const result = deletePiece(board, r, c, CPU);
        if (!result) continue;

        candidates.push({
          type: ITEM.DELETE,
          row: r,
          column: c,
          board: result.board,
          itemWeight: config.godMode ? -8 : -20,
        });
      }
    }
  }

  if (cpuItems?.pushRight > 0) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        const result = pushPieceRight(board, r, c, CPU);
        if (!result) continue;

        candidates.push({
          type: ITEM.PUSH_RIGHT,
          row: r,
          column: c,
          board: result.board,
          itemWeight: config.godMode ? -2 : 0,
        });
      }
    }
  }

  if (cpuItems?.pushDown > 0) {
    for (let c = 0; c < columns; c++) {
      const result = pushColumnFromTop(board, c, CPU);
      if (!result) continue;

      candidates.push({
        type: ITEM.PUSH_DOWN,
        column: c,
        board: result.board,
        itemWeight: config.godMode ? -4 : -10,
      });
    }
  }

  return candidates;
}

function evaluateAfterItem(board: Board, config: any) {
  if (config.godMode) {
    const searchDepth = getGodSearchDepth(board, config.depth);

    return minimax(
      board,
      Math.max(1, searchDepth - 1),
      -Infinity,
      Infinity,
      false,
      config.attackWeight,
      config.defenseWeight
    );
  }

  return evaluateBoard(
    board,
    config.attackWeight,
    config.defenseWeight
  );
}

// =========================
// 🎯 補助関数
// =========================
function findImmediateMove(board: Board, player: CellValue) {
  const validColumns = getValidColumns(board);

  for (const col of validColumns) {
    const sim = simulateMove(board, col, player);
    if (!sim) continue;

    if (checkWin(sim.board, sim.row, col)) {
      return col;
    }
  }

  return -1;
}

function hasImmediateWinningMove(board: Board, player: CellValue) {
  return findImmediateMove(board, player) !== -1;
}

function countImmediateWinningMoves(board: Board, player: CellValue) {
  const validColumns = getValidColumns(board);
  let count = 0;

  for (const col of validColumns) {
    const sim = simulateMove(board, col, player);
    if (!sim) continue;

    if (checkWin(sim.board, sim.row, col)) {
      count += 1;
    }
  }

  return count;
}

function orderColumnsByCenter(board: Board, columns: number[]) {
  const center = Math.floor(getBoardColumns(board) / 2);

  return [...columns].sort(
    (a, b) => Math.abs(a - center) - Math.abs(b - center)
  );
}

function findMoveCreatingDoubleThreat(board: Board, player: CellValue) {
  const validColumns = orderColumnsByCenter(board, getValidColumns(board));

  for (const col of validColumns) {
    const sim = simulateMove(board, col, player);
    if (!sim) continue;

    if (hasImmediateWinningMove(sim.board, PLAYER)) {
      continue;
    }

    if (countImmediateWinningMoves(sim.board, player) >= 2) {
      return col;
    }
  }

  return -1;
}

function findMoveReducingPlayerDoubleThreat(board: Board) {
  const currentThreatCount = countImmediateWinningMoves(board, PLAYER);

  if (currentThreatCount < 2) {
    return -1;
  }

  const validColumns = orderColumnsByCenter(board, getValidColumns(board));

  let bestCol = -1;
  let bestThreatCount = currentThreatCount;

  for (const col of validColumns) {
    const sim = simulateMove(board, col, CPU);
    if (!sim) continue;

    if (hasImmediateWinningMove(sim.board, PLAYER)) {
      continue;
    }

    const threatCount = countImmediateWinningMoves(sim.board, PLAYER);

    if (threatCount < bestThreatCount) {
      bestThreatCount = threatCount;
      bestCol = col;
    }
  }

  return bestCol;
}

function countPieces(board: Board) {
  let count = 0;

  for (let r = 0; r < getBoardRows(board); r++) {
    for (let c = 0; c < getBoardColumns(board); c++) {
      if (board[r][c] !== CELL.EMPTY) {
        count += 1;
      }
    }
  }

  return count;
}

function getGodSearchDepth(board: Board, baseDepth: number) {
  const pieces = countPieces(board);
  const rows = getBoardRows(board);
  const columns = getBoardColumns(board);
  const cells = rows * columns;
  const fillRate = pieces / cells;

  if (cells <= 42) {
    if (fillRate >= 0.55) return 8;
    if (fillRate >= 0.35) return 7;
    return 7;
  }

  if (cells <= 64) {
    if (fillRate >= 0.55) return 7;
    if (fillRate >= 0.35) return 6;
    return 6;
  }

  if (fillRate >= 0.5) return 6;
  return 5;
}