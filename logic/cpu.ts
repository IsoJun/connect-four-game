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
  const safeLevel = Math.max(1, Math.min(10, level));

  const depth =
    safeLevel <= 2 ? 1 :
    safeLevel <= 5 ? 2 :
    safeLevel <= 8 ? 3 :
    4;

  const adjustedDepth =
    cells >= 100 ? Math.min(depth, 3) :
    cells >= 64 ? Math.min(depth, 4) :
    depth;

  const mistakeRate =
    safeLevel <= 2 ? 0.45 :
    safeLevel <= 4 ? 0.28 :
    safeLevel <= 6 ? 0.14 :
    safeLevel <= 8 ? 0.06 :
    0.01;

  const defenseWeight =
    safeLevel <= 3 ? 0.8 :
    safeLevel <= 6 ? 1.0 :
    safeLevel <= 8 ? 1.15 :
    1.3;

  const attackWeight =
    safeLevel <= 3 ? 0.85 :
    safeLevel <= 6 ? 1.0 :
    safeLevel <= 8 ? 1.15 :
    1.25;

  const itemUseRate =
    safeLevel <= 3 ? 0.15 :
    safeLevel <= 6 ? 0.35 :
    safeLevel <= 8 ? 0.55 :
    0.7;

  const itemScoreThreshold =
    safeLevel <= 3 ? 120 :
    safeLevel <= 6 ? 80 :
    safeLevel <= 8 ? 50 :
    30;

  return {
    depth: adjustedDepth,
    mistakeRate,
    defenseWeight,
    attackWeight,
    itemUseRate,
    itemScoreThreshold,
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

  if (cpuCount === 4) return 100000;
  if (playerCount === 4) return -100000;

  let score = 0;

  if (cpuCount === 3 && emptyCount === 1) score += 120 * attackWeight;
  if (cpuCount === 2 && emptyCount === 2) score += 18 * attackWeight;

  if (playerCount === 3 && emptyCount === 1) score -= 160 * defenseWeight;
  if (playerCount === 2 && emptyCount === 2) score -= 22 * defenseWeight;

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
    if (board[r][center] === CPU) score += 6;
    if (board[r][center] === PLAYER) score -= 6;
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

  const validColumns = getValidColumns(board);

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
  const validColumns = getValidColumns(board);

  if (validColumns.length === 0) {
    return { column: -1 };
  }

  if (Math.random() < config.mistakeRate) {
    return {
      column: validColumns[Math.floor(Math.random() * validColumns.length)],
    };
  }

  for (const col of validColumns) {
    const sim = simulateMove(board, col, CPU);
    if (sim && checkWin(sim.board, sim.row, col)) {
      return { column: col };
    }
  }

  for (const col of validColumns) {
    const sim = simulateMove(board, col, PLAYER);
    if (sim && checkWin(sim.board, sim.row, col)) {
      return { column: col };
    }
  }

  let bestScore = -Infinity;
  let bestCols: number[] = [];

  for (const col of validColumns) {
    const sim = simulateMove(board, col, CPU);
    if (!sim) continue;

    const score = minimax(
      sim.board,
      config.depth - 1,
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

  return {
    column:
      bestCols[Math.floor(Math.random() * bestCols.length)] ??
      validColumns[0],
  };
}

// =========================
// 🎯 CPUアクション
// =========================
export function getCpuAction(board: Board, cpuLevel: number, cpuItems: any) {
  const rows = getBoardRows(board);
  const columns = getBoardColumns(board);
  const config = getCpuLevelConfig(cpuLevel, rows, columns);

  // ① 置けば勝てるなら、アイテムより優先して勝つ
  const winMove = findImmediateMove(board, CPU);
  if (winMove !== -1) {
    return { type: 'drop', column: winMove };
  }

  // ② 置けば防げるなら、まず普通に防ぐ
  const blockMove = findImmediateMove(board, PLAYER);
  if (blockMove !== -1) {
    return { type: 'drop', column: blockMove };
  }

  // ③ レベル別にアイテム使用率を制限
  if (Math.random() < config.itemUseRate) {
    const itemAction = findBestCpuItemAction(board, cpuItems, config);

    if (itemAction) {
      return itemAction;
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
function findBestCpuItemAction(board: Board, cpuItems: any, config: any) {
  const candidates: any[] = [];

  // 消す：CPU自身のコマのみ
  // 強すぎ防止のため、基本は評価改善が大きい時だけ使う
  if (cpuItems.delete > 0) {
    for (let r = 0; r < getBoardRows(board); r++) {
      for (let c = 0; c < getBoardColumns(board); c++) {
        const result = deletePiece(board, r, c, CPU);
        if (!result) continue;

        candidates.push({
          type: ITEM.DELETE,
          row: r,
          column: c,
          board: result.board,
          itemWeight: -20,
        });
      }
    }
  }

  // 右へ：CPU自身のコマのみ
  if (cpuItems.pushRight > 0) {
    for (let r = 0; r < getBoardRows(board); r++) {
      for (let c = 0; c < getBoardColumns(board); c++) {
        const result = pushPieceRight(board, r, c, CPU);
        if (!result) continue;

        candidates.push({
          type: ITEM.PUSH_RIGHT,
          row: r,
          column: c,
          board: result.board,
          itemWeight: 0,
        });
      }
    }
  }

  // 潰す：新仕様
  // 一番下がCPUのコマである列だけ実行可能
  if (cpuItems.pushDown > 0) {
    for (let c = 0; c < getBoardColumns(board); c++) {
      const result = pushColumnFromTop(board, c, CPU);
      if (!result) continue;

      candidates.push({
        type: ITEM.PUSH_DOWN,
        column: c,
        board: result.board,
        itemWeight: -10,
      });
    }
  }

  if (candidates.length === 0) return null;

  // ① アイテムで即勝利できるなら採用
  for (const action of candidates) {
    if (findAnyWin(action.board, CPU).length >= 4) {
      return action;
    }
  }

  // ② 相手の即勝利を消せるなら採用
  const playerThreatBefore = hasImmediateWinningMove(board, PLAYER);

  if (playerThreatBefore) {
    for (const action of candidates) {
      if (!hasImmediateWinningMove(action.board, PLAYER)) {
        return action;
      }
    }
  }

  // ③ 評価値が明確に良くなる場合だけ使う
  const beforeScore = evaluateBoard(
    board,
    config.attackWeight,
    config.defenseWeight
  );

  let bestAction = null;
  let bestGain = 0;

  for (const action of candidates) {
    const afterScore = evaluateBoard(
      action.board,
      config.attackWeight,
      config.defenseWeight
    );

    const gain = afterScore - beforeScore + action.itemWeight;

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