import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { RESULT, GAME_MODE } from '../hooks/useGame';

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

  const displayStatus =
    statusText ??
    getDefaultStatusText(result, stage, gameMode);

  return (
    <View style={styles.container}>

      {/* タイトル戻る */}
      {onBack && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          disabled={disabled}
        >
          <Text style={styles.backButtonText}>← タイトル</Text>
        </TouchableOpacity>
      )}

      {/* モード表示 */}
      <Text style={styles.modeText}>
        {gameMode === GAME_MODE.STAGE && 'ステージモード'}
        {gameMode === GAME_MODE.PVC && 'CPU対戦'}
        {gameMode === GAME_MODE.PVP && '2人対戦'}
      </Text>

      {/* ステージ情報（stageのみ） */}
      {gameMode === GAME_MODE.STAGE && (
        <>
          <Text style={styles.title}>
            ステージ {stage}
          </Text>

          <Text style={styles.subText}>
            CPU: {stageLevel}
          </Text>

          <Text style={styles.progress}>
            解放済み: {maxUnlockedStage} / {maxStage}
          </Text>
        </>
      )}

      {/* CPU対戦 */}
      {gameMode === GAME_MODE.PVC && (
        <Text style={styles.subText}>
          CPU: {stageLevel}
        </Text>
      )}

      {/* ステータス */}
      <Text style={styles.status}>
        {displayStatus}
      </Text>

      {/* ステージ操作（stageのみ） */}
      {gameMode === GAME_MODE.STAGE && (
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
      )}

      {/* 共通ボタン */}
      <View style={styles.actionRow}>

        {/* リトライ */}
        {gameMode !== GAME_MODE.STAGE && (
          <TouchableOpacity
            style={[styles.retryButton, disabled && styles.disabled]}
            onPress={onRetry}
            disabled={disabled}
          >
            <Text style={styles.retryButtonText}>リトライ</Text>
          </TouchableOpacity>
        )}

        {/* ステージ選択（stageのみ） */}
        {gameMode === GAME_MODE.STAGE && onStageSelect && (
          <TouchableOpacity
            style={styles.subButton}
            onPress={onStageSelect}
          >
            <Text style={styles.subButtonText}>
              ステージ選択
            </Text>
          </TouchableOpacity>
        )}

        {/* タイトル */}
        {onTitle && (
          <TouchableOpacity
            style={styles.subButton}
            onPress={onTitle}
          >
            <Text style={styles.subButtonText}>
              タイトルへ
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* クリア時ボタン */}
      {gameMode === GAME_MODE.STAGE &&
        result === RESULT.WIN &&
        stage < maxStage && (
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

function getDefaultStatusText(
  result: string,
  stage: number,
  mode: string
): string {
  if (mode === GAME_MODE.STAGE) {
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

  if (mode === GAME_MODE.PVC) {
    return result === RESULT.PLAYING ? '対戦中...' : '';
  }

  if (mode === GAME_MODE.PVP) {
    return result === RESULT.PLAYING ? '対戦中...' : '';
  }

  return '';
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
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  subButton: {
    backgroundColor: '#546e7a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  subButtonText: {
    color: '#fff',
    fontWeight: '800',
  },
  nextStageButton: {
    backgroundColor: '#ff7043',
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 8,
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