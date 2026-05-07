import {
  Board,
  CELL,
  CellValue,
  cloneBoard,
  applyGravityToColumn,
  getAvailableRow,
  getBoardRows,
  getBoardColumns,
  isInsideBoard,
} from './gameLogic';

export const ITEM = {
  NONE: null,
  DELETE: 'delete',
  CRUSH: 'push_down',
  PUSH_RIGHT: 'push_right',

  // 互換
  PUSH_DOWN: 'push_down',
} as const;

export type ItemType = typeof ITEM[keyof typeof ITEM];

export type ItemResult = {
  board: Board;
} | null;

// =========================
// 共通
// =========================

function isPlayerPiece(
  board: Board,
  row: number,
  column: number,
  player: CellValue
): boolean {
  if (!isInsideBoard(board, row, column)) return false;
  if (board[row][column] === CELL.EMPTY) return false;

  return board[row][column] === player;
}

function getBottomPiece(
  board: Board,
  column: number
): CellValue {
  const rows = getBoardRows(board);

  for (let row = rows - 1; row >= 0; row--) {
    if (board[row][column] !== CELL.EMPTY) {
      return board[row][column];
    }
  }

  return CELL.EMPTY;
}

// =========================
// 消す
// =========================

export function canDeletePiece(
  board: Board,
  row: number,
  column: number,
  player: CellValue
): boolean {
  return isPlayerPiece(board, row, column, player);
}

export function deletePiece(
  board: Board,
  row: number,
  column: number,
  player: CellValue
): ItemResult {
  if (!canDeletePiece(board, row, column, player)) return null;

  const newBoard = cloneBoard(board);
  newBoard[row][column] = CELL.EMPTY;

  return {
    board: applyGravityToColumn(newBoard, column),
  };
}

// =========================
// 潰す（新仕様）
// =========================

export function canCrushColumn(
  board: Board,
  column: number,
  player: CellValue
): boolean {
  if (column < 0 || column >= getBoardColumns(board)) return false;

  const bottom = getBottomPiece(board, column);

  // 一番下が自分のコマのみ
  return bottom === player;
}

export function crushColumn(
  board: Board,
  column: number,
  player: CellValue
): ItemResult {
  if (!canCrushColumn(board, column, player)) return null;

  const newBoard = cloneBoard(board);
  const rows = getBoardRows(newBoard);

  for (let row = 0; row < rows; row++) {
    newBoard[row][column] = CELL.EMPTY;
  }

  return { board: newBoard };
}

// 互換
export function canPushColumnFromTop(
  board: Board,
  column: number,
  player: CellValue
): boolean {
  return canCrushColumn(board, column, player);
}

export function pushColumnFromTop(
  board: Board,
  column: number,
  player: CellValue
): ItemResult {
  return crushColumn(board, column, player);
}

// =========================
// 右へ
// =========================

export function canPushPieceRight(
  board: Board,
  row: number,
  column: number,
  player: CellValue
): boolean {
  if (!isPlayerPiece(board, row, column, player)) return false;
  if (column >= getBoardColumns(board) - 1) return false;
  if (board[row][column + 1] !== CELL.EMPTY) return false;

  return true;
}

export function pushPieceRight(
  board: Board,
  row: number,
  column: number,
  player: CellValue
): ItemResult {
  if (!canPushPieceRight(board, row, column, player)) return null;

  const movedPiece = board[row][column];

  let newBoard = cloneBoard(board);
  newBoard[row][column] = CELL.EMPTY;

  newBoard = applyGravityToColumn(newBoard, column);

  const targetRow = getAvailableRow(newBoard, column + 1);
  if (targetRow === -1) return null;

  newBoard[targetRow][column + 1] = movedPiece;

  return { board: newBoard };
}