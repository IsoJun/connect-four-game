import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

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
    <View
      style={[
        styles.container,
        disabled && styles.disabled,
      ]}
    >
      <Text style={styles.label}>
        {label}
      </Text>

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

    backgroundColor: 'rgba(255,255,255,0.92)',

    borderRadius: 18,

    paddingHorizontal: 12,
    paddingVertical: 10,

    borderWidth: 2,
    borderColor: '#d6e8ff',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,

    elevation: 2,
  },

  disabled: {
    opacity: 0.42,
  },

  label: {
    fontWeight: '900',
    fontSize: 15,

    color: '#37474f',

    marginBottom: 6,
  },
});