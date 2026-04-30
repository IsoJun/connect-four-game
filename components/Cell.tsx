// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  View,
  Image,
  StyleSheet,
  Animated,
} from 'react-native';

export function Cell({
  size,
  margin,
  imageSource,
  isWinning = false,
  isSelectable = false,
  disabled = false,
  onPress,
}) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isWinning) {
      scale.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.15,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [isWinning]);

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={disabled}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.frame,
          {
            width: size,
            height: size,
            margin,
            transform: [{ scale }],
          },
          isWinning && styles.winning,
          isSelectable && styles.selectable,
        ]}
      >
        {imageSource ? (
          <Image source={imageSource} style={styles.image} />
        ) : (
          <View style={styles.empty} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  empty: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  winning: {
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#fff176',
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  selectable: {
    borderWidth: 3,
    borderColor: '#ffeb3b',
    backgroundColor: 'rgba(255,235,59,0.18)',
  },
});