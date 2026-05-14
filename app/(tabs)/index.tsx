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

import AdBanner from '../../components/AdBanner';
import { requestTrackingPermissionIfNeeded } from '../../utils/requestTrackingPermission';
import {
  initCommonSounds,
  playTapSound,
} from '../../utils/sound';

export default function TitleScreen() {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    requestTrackingPermissionIfNeeded();
    initCommonSounds();
  }, []);

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
  }, [scaleAnim]);

  return (
    <View style={styles.screen}>
      <ImageBackground
        source={require('../../assets/images/title-screen.png')}
        style={styles.container}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Text style={styles.title}></Text>
            <Text style={styles.subtitle}>ボタンをタップしてゲームスタート</Text>
          </Animated.View>

          <TouchableOpacity
            style={styles.startButton}
            onPress={async () => {
              await playTapSound();
              router.push('/stages');
            }}
          >
            <Text style={styles.startText}>ステージ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.subButton}
            onPress={async () => {
              await playTapSound();
              router.push('/game?mode=pvc');
            }}
          >
            <Text style={styles.subText}>CPU対戦</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.subButton}
            onPress={async () => {
              await playTapSound();
              router.push('/game?mode=pvp');
            }}
          >
            <Text style={styles.subText}>2人対戦</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingButton}
            onPress={async () => {
              await playTapSound();
              router.push('/settings');
            }}
          >
            <Text style={styles.settingText}>設定</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>

      <AdBanner position="bottom" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },

  container: {
    flex: 1,
  },

  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
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
    fontSize: 18,
    color: '#fff',
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
    backgroundColor: '#ff7043',
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
    backgroundColor: '#1565c0',
    paddingVertical: 14,
    paddingHorizontal: 60,
    borderRadius: 12,
    marginBottom: 14,
  },

  settingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});