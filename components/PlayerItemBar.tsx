import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ItemBar } from './ItemBar';

type Props = {
  label: string;
  activeItem: any;
  deleteLeft: number;
  pushDownLeft: number;
  pushRightLeft: number;
  disabled: boolean;
  onSelectItem: (item: any) => void;
  onCancelItem: () => void;
};

export function PlayerItemBar({
  label,
  activeItem,
  deleteLeft,
  pushDownLeft,
  pushRightLeft,
  disabled,
  onSelectItem,
  onCancelItem,
}: Props) {
  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      <Text style={styles.label}>{label}</Text>

      <ItemBar
        activeItem={activeItem}
        deleteLeft={deleteLeft}
        pushDownLeft={pushDownLeft}
        pushRightLeft={pushRightLeft}
        disabled={disabled}
        onSelectItem={onSelectItem}
        onCancelItem={onCancelItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 10,
  },
  label: {
    fontWeight: '900',
    fontSize: 14,
    marginBottom: 4,
  },
  disabled: {
    opacity: 0.4,
  },
});