import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { RESULT } from '../hooks/useGame';

type StageHeaderProps = {
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
};

export function StageHeader({
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
}: StageHeaderProps) {
  const canGoPrev = stage > 1;
  const canGoNext = stage < maxUnlockedStage;

  const displayStatus =
    statusText ??
    getDefaultStatusText(result, stage);

  return (
    <View style={styles.container}>
      {onBack && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          disabled={disabled}
        >
          <Text style={styles.backButtonText}>← タイトル</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.title}>
        ステージ {stage}
      </Text>

      <Text style={styles.subText}>
        CPU: {stageLevel}
      </Text>

      <Text style={styles.status}>
        {displayStatus}
      </Text>

      <Text style={styles.progress}>
        解放済み: {maxUnlockedStage} / {maxStage}
      </Text>

      <View style={styles.navRow}>
        <TouchableOpacity
          style={[
            styles.navButton,
            (!canGoPrev || disabled) && styles.disabled,
          ]}
          onPress={onPrevStage}
          disabled={!canGoPrev || disabled}
        >
          <Text style={styles.navButtonText}>前</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.retryButton,
            disabled && styles.disabled,
          ]}
          onPress={onRetry}
          disabled={disabled}
        >
          <Text style={styles.retryButtonText}>リトライ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            (!canGoNext || disabled) && styles.disabled,
          ]}
          onPress={onNextStage}
          disabled={!canGoNext || disabled}
        >
          <Text style={styles.navButtonText}>次</Text>
        </TouchableOpacity>
      </View>

      {result === RESULT.WIN && stage < maxStage && (
        <TouchableOpacity
          style={[
            styles.nextStageButton,
            disabled && styles.disabled,
          ]}
          onPress={onNextStage}
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

function getDefaultStatusText(result: string, stage: number): string {
  switch (result) {
    case RESULT.WIN:
      return `ステージ${stage} クリア！`;
    case RESULT.LOSE:
      return `ステージ${stage} 失敗...`;
    case RESULT.DRAW:
      return '引き分け！';
    default:
      return 'あなたの番です';
  }
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
  title: {
    fontSize: 30,
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
    paddingVertical: 9,
    borderRadius: 10,
  },
  navButtonText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  retryButton: {
    backgroundColor: '#37474f',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  nextStageButton: {
    backgroundColor: '#ff7043',
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 12,
  },
  nextStageButtonText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 15,
  },
  disabled: {
    opacity: 0.4,
  },
});