import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { ITEM, ItemType } from '../logic/items';

type ItemBarProps = {
  activeItem: ItemType;
  deleteLeft: number;
  pushDownLeft: number;
  pushRightLeft: number;
  disabled?: boolean;
  onSelectItem: (item: ItemType) => void;
  onCancelItem?: () => void;
};

export function ItemBar({
  activeItem,
  deleteLeft,
  pushDownLeft,
  pushRightLeft,
  disabled = false,
  onSelectItem,
  onCancelItem,
}: ItemBarProps) {
  const hasActiveItem =
    activeItem !== ITEM.NONE &&
    activeItem !== null;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <ItemButton
          label="消す"
          count={deleteLeft}
          active={activeItem === ITEM.DELETE}
          disabled={disabled || deleteLeft <= 0}
          onPress={() => onSelectItem(ITEM.DELETE)}
        />

        <ItemButton
          label="潰す"
          count={pushDownLeft}
          active={activeItem === ITEM.PUSH_DOWN}
          disabled={disabled || pushDownLeft <= 0}
          onPress={() => onSelectItem(ITEM.PUSH_DOWN)}
        />

        <ItemButton
          label="右へ"
          count={pushRightLeft}
          active={activeItem === ITEM.PUSH_RIGHT}
          disabled={disabled || pushRightLeft <= 0}
          onPress={() => onSelectItem(ITEM.PUSH_RIGHT)}
        />
      </View>

      {hasActiveItem && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancelItem}
          disabled={disabled}
        >
          <Text style={styles.cancelButtonText}>
            アイテム取消
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

type ItemButtonProps = {
  label: string;
  count: number;
  active: boolean;
  disabled: boolean;
  onPress: () => void;
};

function ItemButton({
  label,
  count,
  active,
  disabled,
  onPress,
}: ItemButtonProps) {
  const available = !disabled && count > 0;

  return (
    <TouchableOpacity
      style={[
        styles.itemButton,

        available &&
          styles.itemButtonAvailable,

        active &&
          styles.itemButtonActive,

        disabled &&
          styles.disabled,
      ]}
      disabled={disabled}
      onPress={onPress}
    >
      <Text style={styles.itemButtonText}>
        {label} ×{count}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 8,
  },

  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },

  itemButton: {
    backgroundColor: '#1565c0',

    paddingHorizontal: 14,
    paddingVertical: 9,

    borderRadius: 12,

    minWidth: 82,

    alignItems: 'center',

    borderWidth: 3,
    borderColor: '#90a4ae',
  },

  // 使用可能
  itemButtonAvailable: {
    borderColor: '#ffe082',

    shadowColor: '#ffd54f',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.9,
    shadowRadius: 8,

    elevation: 6,
  },

  // 選択中
  itemButtonActive: {
    backgroundColor: '#ff7043',

    borderColor: '#fff3e0',

    shadowColor: '#ffb74d',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 1,
    shadowRadius: 12,

    elevation: 10,

    transform: [{ scale: 1.06 }],
  },

  itemButtonText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
  },

  cancelButton: {
    marginTop: 8,

    backgroundColor: '#78909c',

    paddingHorizontal: 16,
    paddingVertical: 8,

    borderRadius: 10,
  },

  cancelButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },

  disabled: {
    opacity: 0.4,
  },
});