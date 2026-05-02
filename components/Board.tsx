// @ts-nocheck
import React, { useRef, useState } from 'react';
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
  const [highlightColumn, setHighlightColumn] = useState(null);
  const clearTimer = useRef(null);

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

  function showHighlight(column: number) {
    if (disabled) return;
    if (activeItem === ITEM.DELETE || activeItem === ITEM.PUSH_RIGHT) return;

    if (clearTimer.current) {
      clearTimeout(clearTimer.current);
    }

    setHighlightColumn(column);
  }

  function hideHighlight(delay = 120) {
    if (clearTimer.current) {
      clearTimeout(clearTimer.current);
    }

    clearTimer.current = setTimeout(() => {
      setHighlightColumn(null);
    }, delay);
  }

  function handleCellPress(row: number, column: number) {
    if (disabled) return;

    showHighlight(column);

    setTimeout(() => {
      if (activeItem === ITEM.DELETE || activeItem === ITEM.PUSH_RIGHT) {
        onCellPress(row, column);
        hideHighlight(120);
        return;
      }

      onColumnPress(column);
      hideHighlight(120);
    }, 80);
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
            const highlighted = highlightColumn === columnIndex;

            return (
              <View
                key={`wrap-${rowIndex}-${columnIndex}`}
                style={[
                  highlighted && styles.columnBackground,
                ]}
              >
                <Cell
                  key={`cell-${rowIndex}-${columnIndex}`}
                  size={cellSize}
                  margin={cellMargin}
                  imageSource={getPieceImage(cell)}
                  isWinning={isWinningCell(rowIndex, columnIndex)}
                  isSelectable={selectable}
                  isColumnHighlighted={highlighted}
                  disabled={disabled}
                  onPress={() => handleCellPress(rowIndex, columnIndex)}
                  onPressIn={() => showHighlight(columnIndex)}
                  onPressOut={() => hideHighlight(120)}
                />
              </View>
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
  columnBackground: {
    backgroundColor: 'rgba(255,235,59,0.12)',
    borderRadius: 8,
  },
});