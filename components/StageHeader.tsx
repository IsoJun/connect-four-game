import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { RESULT, GAME_MODE } from '../hooks/useGame';
import { playTapSound } from '../utils/sound';

type StageHeaderProps = {
  gameMode: string;

  stage: number;
  maxStage: number;
  maxUnlockedStage: number;
  stageLevel: string;

  result: string;
  statusText?: string;
  disabled?: boolean;

  onBack?: () => void;
  onRetry: () => void;
  onPrevStage: () => void;
  onNextStage: () => void;

  onStageSelect?: () => void;
  onTitle?: () => void;
};

export function StageHeader({
  gameMode,

  stage,
  maxStage,
  maxUnlockedStage,
  stageLevel,

  result,
  statusText,
  disabled = false,

  onBack,
  onRetry,
  onPrevStage,
  onNextStage,

  onStageSelect,
  onTitle,
}: StageHeaderProps) {
  const canGoPrev = stage > 1;
  const canGoNext = stage < maxUnlockedStage;

  async function handleTap(action?: () => void) {
    if (!action) return;

    await playTapSound();
    action();
  }

  return (
    <View style={styles.container}>
      
      <Text style={styles.modeText}>
        {gameMode === GAME_MODE.STAGE && 'ステージモード'}
        {gameMode === GAME_MODE.PVC && 'CPU対戦'}
        {gameMode === GAME_MODE.PVP && '2人対戦'}
      </Text>

      {gameMode === GAME_MODE.STAGE && (
        <>
          <Text style={styles.title}>ステージ {stage}</Text>

          <Text style={styles.subText}>CPU: {stageLevel}</Text>

          <Text style={styles.progress}>
            解放済み: {maxUnlockedStage} / {maxStage}
          </Text>
        </>
      )}

      {gameMode === GAME_MODE.PVC && (
        <Text style={styles.subText}>CPU: {stageLevel}</Text>
      )}

      {!!statusText && (
        <Text style={styles.status}>{statusText}</Text>
      )}

      {gameMode === GAME_MODE.STAGE && (
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[
              styles.navButton,
              (!canGoPrev || disabled) && styles.disabled,
            ]}
            onPress={() => handleTap(onPrevStage)}
            disabled={!canGoPrev || disabled}
          >
            <Text style={styles.navButtonText}>前</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.retryButton,
              disabled && styles.disabled,
            ]}
            onPress={() => handleTap(onRetry)}
            disabled={disabled}
          >
            <Text style={styles.retryButtonText}>リトライ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navButton,
              (!canGoNext || disabled) && styles.disabled,
            ]}
            onPress={() => handleTap(onNextStage)}
            disabled={!canGoNext || disabled}
          >
            <Text style={styles.navButtonText}>次</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.actionRow}>
        {gameMode !== GAME_MODE.STAGE && (
          <TouchableOpacity
            style={[styles.retryButton, disabled && styles.disabled]}
            onPress={() => handleTap(onRetry)}
            disabled={disabled}
          >
            <Text style={styles.retryButtonText}>リトライ</Text>
          </TouchableOpacity>
        )}

        {gameMode === GAME_MODE.STAGE && onStageSelect && (
          <TouchableOpacity
            style={[styles.subButton, disabled && styles.disabled]}
            onPress={() => handleTap(onStageSelect)}
            disabled={disabled}
          >
            <Text style={styles.subButtonText}>ステージ選択</Text>
          </TouchableOpacity>
        )}

        {onTitle && (
          <TouchableOpacity
            style={[styles.subButton, disabled && styles.disabled]}
            onPress={() => handleTap(onTitle)}
            disabled={disabled}
          >
            <Text style={styles.subButtonText}>タイトルへ</Text>
          </TouchableOpacity>
        )}
      </View>

      {gameMode === GAME_MODE.STAGE &&
        result === RESULT.WIN &&
        stage < maxStage && (
          <TouchableOpacity
            style={[
              styles.nextStageButton,
              disabled && styles.disabled,
            ]}
            onPress={() => handleTap(onNextStage)}
            disabled={disabled}
          >
            <Text style={styles.nextStageButtonText}>
              次のステージへ
            </Text>
          </TouchableOpacity>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 8,
  },

  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },

  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2b4c7e',
  },

  modeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#455a64',
    marginBottom: 4,
  },

  title: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 4,
  },

  subText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#555',
    marginBottom: 6,
  },

  status: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },

  progress: {
    fontSize: 13,
    color: '#555',
    fontWeight: '700',
    marginBottom: 8,
  },

  navRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },

  navButton: {
    backgroundColor: '#1565c0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },

  navButtonText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 15,
  },

  retryButton: {
    backgroundColor: '#ff7043',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,

    elevation: 4,
  },

  retryButtonText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 15,
  },

  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },

  subButton: {
    backgroundColor: '#546e7a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },

  subButtonText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
  },

  nextStageButton: {
    backgroundColor: '#ff7043',

    paddingHorizontal: 24,
    paddingVertical: 13,

    borderRadius: 16,

    marginTop: 10,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.24,
    shadowRadius: 6,

    elevation: 6,
  },

  nextStageButtonText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 17,
  },

  disabled: {
    opacity: 0.4,
  },
});