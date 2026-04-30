// @ts-nocheck
import React from 'react';
import {
  View,
  StyleSheet,
  ImageSourcePropType,
} from 'react-native';

import { Cell } from './Cell';
import { Board as BoardType, CELL, Position } from '../logic/gameLogic';
import {
  ITEM,
  ItemType,
  canDeletePiece,
  canPushPieceRight,
} from '../logic/items';

type BoardProps = {
  board: BoardType;
  cellSize: number;
  cellMargin: number;
  boardPadding: number;

  activeItem: ItemType;
  disabled?: boolean;

  winningCells?: Position[];

  redPiece: ImageSourcePropType;
  yellowPiece: ImageSourcePropType;

  onColumnPress: (column: number) => void;
  onCellPress: (row: number, column: number) => void;
};

export function Board({
  board,
  cellSize,
  cellMargin,
  boardPadding,
  activeItem,
  disabled = false,
  winningCells = [],
  redPiece,
  yellowPiece,
  onColumnPress,
  onCellPress,
}: BoardProps) {
  function getPieceImage(cell: number) {
    if (cell === CELL.RED) return redPiece;
    if (cell === CELL.YELLOW) return yellowPiece;
    return null;
  }

  function isWinningCell(row: number, column: number) {
    return winningCells.some(
      (cell) => cell.row === row && cell.column === column
    );
  }

  function isSelectableCell(row: number, column: number) {
    if (disabled) return false;

    if (activeItem === ITEM.DELETE) {
      return canDeletePiece(board, row, column);
    }

    if (activeItem === ITEM.PUSH_RIGHT) {
      return canPushPieceRight(board, row, column);
    }

    return false;
  }

  function handleCellPress(row: number, column: number) {
    if (disabled) return;

    if (activeItem === ITEM.DELETE || activeItem === ITEM.PUSH_RIGHT) {
      onCellPress(row, column);
      return;
    }

    if (activeItem === ITEM.PUSH_DOWN) {
      onColumnPress(column);
      return;
    }

    onColumnPress(column);
  }

  return (
    <View
      style={[
        styles.board,
        {
          padding: boardPadding,
        },
      ]}
    >
      {board.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((cell, columnIndex) => {
            const selectable = isSelectableCell(rowIndex, columnIndex);

            return (
              <Cell
                key={`cell-${rowIndex}-${columnIndex}`}
                size={cellSize}
                margin={cellMargin}
                imageSource={getPieceImage(cell)}
                isWinning={isWinningCell(rowIndex, columnIndex)}
                isSelectable={selectable}
                disabled={disabled}
                onPress={() => handleCellPress(rowIndex, columnIndex)}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    backgroundColor: '#1976d2',
    borderRadius: 16,
    position: 'relative',
  },
  row: {
    flexDirection: 'row',
  },
});