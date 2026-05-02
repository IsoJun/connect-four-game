// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function TitleScreen() {
  const router = useRouter();

  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.08,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <ImageBackground
      source={require('../../assets/images/title-screen.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>四目並べ</Text>
        <Text style={styles.subtitle}>Connect Four</Text>

        {/* ステージモード */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => router.push('/stages')}
          >
            <Text style={styles.startText}>ステージ</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* CPU対戦 */}
        <TouchableOpacity
          style={styles.subButton}
          onPress={() => router.push('/game?mode=pvc')}
        >
          <Text style={styles.subText}>CPU対戦</Text>
        </TouchableOpacity>

        {/* 2人対戦 */}
        <TouchableOpacity
          style={styles.subButton}
          onPress={() => router.push('/game?mode=pvp')}
        >
          <Text style={styles.subText}>2人対戦</Text>
        </TouchableOpacity>

        {/* 設定 */}
        <TouchableOpacity
          style={styles.settingButton}
          onPress={() => router.push('/settings')}
        >
          <Text style={styles.settingText}>設定</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },

  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 16,
    color: '#eee',
    marginBottom: 40,
  },

  startButton: {
    backgroundColor: '#ff7043',
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 14,
    marginBottom: 16,
  },

  startText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },

  subButton: {
    backgroundColor: '#1565c0',
    paddingVertical: 14,
    paddingHorizontal: 60,
    borderRadius: 12,
    marginBottom: 14,
  },

  subText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },

  settingButton: {
    position: 'absolute',
    bottom: 40,
  },

  settingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});