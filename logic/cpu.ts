import {
  Board,
  CELL,
  CellValue,
  countImmediateWins,
  getBoardColumns,
  getValidColumns,
  simulateMove,
  checkWin,
} from './gameLogic';

import { StageConfig } from './stages';

export type CpuMoveResult = {
  column: number;
  reason:
    | 'win'
    | 'block'
    | 'score'
    | 'random'
    | 'fallback';
};

function getRandomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function centerScore(board: Board, column: number): number {
  const columns = getBoardColumns(board);
  const center = Math.floor(columns / 2);

  return columns - Math.abs(column - center);
}

function wouldGiveOpponentImmediateWin(
  board: Board,
  opponent: CellValue
): boolean {
  return countImmediateWins(board, opponent) > 0;
}

function scoreCpuMove(
  board: Board,
  column: number,
  config: StageConfig
): number {
  const sim = simulateMove(board, column, CELL.YELLOW);
  if (!sim) return -Infinity;

  let score = 0;

  score += centerScore(board, column) * 3;
  score += countImmediateWins(sim.board, CELL.YELLOW) * 18;
  score -= countImmediateWins(sim.board, CELL.RED) * 24;

  if (wouldGiveOpponentImmediateWin(sim.board, CELL.RED)) {
    score -= config.level === 'expert' ? 220 : 120;
  }

  if (config.cpuLookahead >= 2) {
    score += countImmediateWins(sim.board, CELL.YELLOW) * 24;
    score -= countImmediateWins(sim.board, CELL.RED) * 32;
  }

  score += Math.random() * config.cpuRandomness * 20;

  return score;
}

export function getCpuMove(
  board: Board,
  config: StageConfig
): CpuMoveResult {
  const validColumns = getValidColumns(board);

  if (validColumns.length === 0) {
    return {
      column: -1,
      reason: 'fallback',
    };
  }

  if (config.level === 'easy' && Math.random() < config.cpuRandomness) {
    return {
      column: getRandomItem(validColumns),
      reason: 'random',
    };
  }

  for (const column of validColumns) {
    const sim = simulateMove(board, column, CELL.YELLOW);
    if (sim && checkWin(sim.board, sim.row, column)) {
      return {
        column,
        reason: 'win',
      };
    }
  }

  for (const column of validColumns) {
    const sim = simulateMove(board, column, CELL.RED);
    if (sim && checkWin(sim.board, sim.row, column)) {
      return {
        column,
        reason: 'block',
      };
    }
  }

  let bestScore = -Infinity;
  let bestColumns: number[] = [];

  for (const column of validColumns) {
    const score = scoreCpuMove(board, column, config);

    if (score > bestScore) {
      bestScore = score;
      bestColumns = [column];
    } else if (score === bestScore) {
      bestColumns.push(column);
    }
  }

  if (bestColumns.length > 0) {
    return {
      column: getRandomItem(bestColumns),
      reason: 'score',
    };
  }

  return {
    column: validColumns[0],
    reason: 'fallback',
  };
}