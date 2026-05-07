// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
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
  canCrushColumn,
} from '../logic/items';

type BoardEffectEvent = {
  id: number;
  type: 'delete' | 'crash' | 'push';
  cells: { row: number; col: number }[];
};

type BoardProps = {
  board: BoardType;
  cellSize: number;
  cellMargin: number;
  boardPadding: number;
  currentPlayer: number;

  activeItem: ItemType;
  disabled?: boolean;

  winningCells?: Position[];

  redPiece: ImageSourcePropType;
  yellowPiece: ImageSourcePropType;

  onColumnPress: (column: number) => void;
  onCellPress: (row: number, column: number) => void;

  boardEffectEvent?: BoardEffectEvent | null;
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
  currentPlayer,
  boardEffectEvent,
}: BoardProps) {
  const [highlightColumn, setHighlightColumn] = useState(null);
  const clearTimer = useRef(null);

  const [activeBoardEffect, setActiveBoardEffect] =
    useState<BoardEffectEvent | null>(null);

  useEffect(() => {
    if (!boardEffectEvent) return;

    setActiveBoardEffect(boardEffectEvent);

    const timer = setTimeout(() => {
      setActiveBoardEffect(null);
    }, 450);

    return () => clearTimeout(timer);
  }, [boardEffectEvent?.id]);

  function isEffectTarget(row: number, column: number) {
    if (!activeBoardEffect) return false;

    return activeBoardEffect.cells.some(
      (cell) => cell.row === row && cell.col === column
    );
  }

  function getEffectIcon() {
    if (!activeBoardEffect) return '';

    if (activeBoardEffect.type === 'delete') return '✦';
    if (activeBoardEffect.type === 'crash') return '↓';
    if (activeBoardEffect.type === 'push') return '→';

    return '';
  }

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
      return canDeletePiece(board, row, column, currentPlayer);
    }

    if (activeItem === ITEM.PUSH_RIGHT) {
      return canPushPieceRight(board, row, column, currentPlayer);
    }

    if (activeItem === ITEM.PUSH_DOWN) {
      return isSelectableColumn(column);
    }

    return false;
  }

  function isSelectableColumn(column: number) {
    if (disabled) return false;

    if (activeItem === ITEM.PUSH_DOWN) {
      return canCrushColumn(board, column, currentPlayer);
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
            const selectableColumn = isSelectableColumn(columnIndex);
            const highlighted =
              highlightColumn === columnIndex ||
              (activeItem === ITEM.PUSH_DOWN && selectableColumn);

            const effectTarget = isEffectTarget(rowIndex, columnIndex);

            return (
              <View
                key={`wrap-${rowIndex}-${columnIndex}`}
                style={[
                  styles.cellWrap,
                  {
                    width: cellSize + cellMargin * 2,
                    height: cellSize + cellMargin * 2,
                  },
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

                {activeBoardEffect && effectTarget && (
                  <View
                    pointerEvents="none"
                    style={[
                      styles.itemBoardEffectOverlay,
                      {
                        left: cellMargin,
                        right: cellMargin,
                        top: cellMargin,
                        bottom: cellMargin,
                        borderRadius: cellSize / 2,
                      },
                      activeBoardEffect.type === 'delete' &&
                        styles.itemBoardEffectDelete,
                      activeBoardEffect.type === 'crash' &&
                        styles.itemBoardEffectCrash,
                      activeBoardEffect.type === 'push' &&
                        styles.itemBoardEffectPush,
                    ]}
                  >
                    <Text style={styles.itemBoardEffectText}>
                      {getEffectIcon()}
                    </Text>
                  </View>
                )}
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
  cellWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  columnBackground: {
    backgroundColor: 'rgba(255,235,59,0.12)',
    borderRadius: 8,
  },
  itemBoardEffectOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  itemBoardEffectDelete: {
    backgroundColor: 'rgba(80, 140, 255, 0.55)',
  },
  itemBoardEffectCrash: {
    backgroundColor: 'rgba(255, 80, 80, 0.55)',
  },
  itemBoardEffectPush: {
    backgroundColor: 'rgba(60, 180, 100, 0.55)',
  },
  itemBoardEffectText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
});