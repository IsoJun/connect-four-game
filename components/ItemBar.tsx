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
  const hasActiveItem = activeItem !== ITEM.NONE && activeItem !== null;

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
          label="押す"
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
          <Text style={styles.cancelButtonText}>アイテム取消</Text>
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
  return (
    <TouchableOpacity
      style={[
        styles.itemButton,
        active && styles.itemButtonActive,
        disabled && styles.disabled,
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
    borderRadius: 10,
    minWidth: 76,
    alignItems: 'center',
  },
  itemButtonActive: {
    backgroundColor: '#ff7043',
  },
  itemButtonText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
  },
  cancelButton: {
    marginTop: 8,
    backgroundColor: '#9e9e9e',
    paddingHorizontal: 14,
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