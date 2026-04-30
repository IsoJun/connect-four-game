import {
  Board,
  CELL,
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
  PUSH_DOWN: 'push_down',
  PUSH_RIGHT: 'push_right',
} as const;

export type ItemType = typeof ITEM[keyof typeof ITEM];

export type ItemResult = {
  board: Board;
} | null;

export function canDeletePiece(
  board: Board,
  row: number,
  column: number
): boolean {
  if (!isInsideBoard(board, row, column)) return false;
  return board[row][column] !== CELL.EMPTY;
}

export function canPushColumnFromTop(
  board: Board,
  column: number
): boolean {
  if (column < 0 || column >= getBoardColumns(board)) return false;

  return board.some((row) => row[column] !== CELL.EMPTY);
}

export function canPushPieceRight(
  board: Board,
  row: number,
  column: number
): boolean {
  if (!isInsideBoard(board, row, column)) return false;
  if (column >= getBoardColumns(board) - 1) return false;
  if (board[row][column] === CELL.EMPTY) return false;
  if (board[row][column + 1] !== CELL.EMPTY) return false;

  return true;
}

export function deletePiece(
  board: Board,
  row: number,
  column: number
): ItemResult {
  if (!canDeletePiece(board, row, column)) return null;

  const newBoard = cloneBoard(board);
  newBoard[row][column] = CELL.EMPTY;

  return {
    board: applyGravityToColumn(newBoard, column),
  };
}

export function pushColumnFromTop(
  board: Board,
  column: number
): ItemResult {
  if (!canPushColumnFromTop(board, column)) return null;

  const newBoard = cloneBoard(board);
  const rows = getBoardRows(newBoard);

  for (let row = rows - 1; row >= 1; row--) {
    newBoard[row][column] = newBoard[row - 1][column];
  }

  newBoard[0][column] = CELL.EMPTY;

  return { board: newBoard };
}

export function pushPieceRight(
  board: Board,
  row: number,
  column: number
): ItemResult {
  if (!canPushPieceRight(board, row, column)) return null;

  const movedPiece = board[row][column];

  let newBoard = cloneBoard(board);
  newBoard[row][column] = CELL.EMPTY;

  newBoard = applyGravityToColumn(newBoard, column);

  const targetRow = getAvailableRow(newBoard, column + 1);
  if (targetRow === -1) return null;

  newBoard[targetRow][column + 1] = movedPiece;

  return { board: newBoard };
}