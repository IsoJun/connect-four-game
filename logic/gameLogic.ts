export const DEFAULT_ROWS = 6;
export const DEFAULT_COLUMNS = 7;

export const CELL = {
  EMPTY: 0,
  RED: 1,
  YELLOW: 2,
} as const;

export type CellValue = typeof CELL[keyof typeof CELL];
export type Board = CellValue[][];

export type Position = {
  row: number;
  column: number;
};

export function parseBoardSize(size: string | null | undefined) {
  if (size === '8x8') {
    return { rows: 8, columns: 8 };
  }

  return { rows: DEFAULT_ROWS, columns: DEFAULT_COLUMNS };
}

export function createBoard(rows = DEFAULT_ROWS, columns = DEFAULT_COLUMNS): Board {
  return Array.from({ length: rows }, () =>
    Array.from({ length: columns }, () => CELL.EMPTY)
  );
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

export function getBoardRows(board: Board): number {
  return board.length;
}

export function getBoardColumns(board: Board): number {
  return board[0]?.length ?? 0;
}

export function isInsideBoard(board: Board, row: number, column: number): boolean {
  return (
    row >= 0 &&
    row < getBoardRows(board) &&
    column >= 0 &&
    column < getBoardColumns(board)
  );
}

export function getAvailableRow(board: Board, column: number): number {
  for (let row = getBoardRows(board) - 1; row >= 0; row--) {
    if (board[row][column] === CELL.EMPTY) {
      return row;
    }
  }

  return -1;
}

export function getValidColumns(board: Board): number[] {
  const columns = getBoardColumns(board);
  const result: number[] = [];

  for (let column = 0; column < columns; column++) {
    if (getAvailableRow(board, column) !== -1) {
      result.push(column);
    }
  }

  return result;
}

export function isBoardFull(board: Board): boolean {
  return getValidColumns(board).length === 0;
}

export function dropPiece(
  board: Board,
  column: number,
  player: CellValue
): { board: Board; row: number } | null {
  const row = getAvailableRow(board, column);
  if (row === -1) return null;

  const newBoard = cloneBoard(board);
  newBoard[row][column] = player;

  return { board: newBoard, row };
}

export function applyGravityToColumn(board: Board, column: number): Board {
  const newBoard = cloneBoard(board);
  const rows = getBoardRows(newBoard);
  const pieces: CellValue[] = [];

  for (let row = rows - 1; row >= 0; row--) {
    if (newBoard[row][column] !== CELL.EMPTY) {
      pieces.push(newBoard[row][column]);
    }
  }

  for (let row = 0; row < rows; row++) {
    newBoard[row][column] = CELL.EMPTY;
  }

  let targetRow = rows - 1;

  for (const piece of pieces) {
    newBoard[targetRow][column] = piece;
    targetRow -= 1;
  }

  return newBoard;
}

export function getWinningCells(
  board: Board,
  row: number,
  column: number
): Position[] {
  const player = board[row]?.[column];

  if (!player || player === CELL.EMPTY) return [];

  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  for (const [dr, dc] of directions) {
    const line: Position[] = [{ row, column }];

    let r = row + dr;
    let c = column + dc;

    while (isInsideBoard(board, r, c) && board[r][c] === player) {
      line.push({ row: r, column: c });
      r += dr;
      c += dc;
    }

    r = row - dr;
    c = column - dc;

    while (isInsideBoard(board, r, c) && board[r][c] === player) {
      line.unshift({ row: r, column: c });
      r -= dr;
      c -= dc;
    }

    if (line.length >= 4) {
      return line.slice(0, 4);
    }
  }

  return [];
}

export function checkWin(board: Board, row: number, column: number): boolean {
  return getWinningCells(board, row, column).length >= 4;
}

export function findAnyWin(board: Board, player: CellValue): Position[] {
  const rows = getBoardRows(board);
  const columns = getBoardColumns(board);

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      if (board[row][column] === player) {
        const win = getWinningCells(board, row, column);
        if (win.length >= 4) return win;
      }
    }
  }

  return [];
}

export function simulateMove(
  board: Board,
  column: number,
  player: CellValue
): { board: Board; row: number } | null {
  return dropPiece(board, column, player);
}

export function countImmediateWins(board: Board, player: CellValue): number {
  const validColumns = getValidColumns(board);
  let count = 0;

  for (const column of validColumns) {
    const sim = simulateMove(board, column, player);
    if (!sim) continue;

    if (checkWin(sim.board, sim.row, column)) {
      count += 1;
    }
  }

  return count;
}