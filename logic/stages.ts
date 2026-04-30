import { ITEM } from './items';

export const MAX_STAGE = 60;

export const STAGE_LEVEL = {
  EASY: 'easy',
  NORMAL: 'normal',
  HARD: 'hard',
  EXPERT: 'expert',
} as const;

export type StageLevel = typeof STAGE_LEVEL[keyof typeof STAGE_LEVEL];

export type StageConfig = {
  stage: number;
  level: StageLevel;
  levelLabel: string;
  cpuThinkingMs: number;
  cpuRandomness: number;
  cpuLookahead: number;
  cpuCanUseItem: boolean;
  unlockedItems: Array<typeof ITEM[keyof typeof ITEM]>;
  itemRule: 'normal' | 'select_one';
};

export function getStageLevel(stage: number): StageLevel {
  if (stage <= 10) return STAGE_LEVEL.EASY;
  if (stage <= 25) return STAGE_LEVEL.NORMAL;
  if (stage <= 45) return STAGE_LEVEL.HARD;
  return STAGE_LEVEL.EXPERT;
}

export function getStageLevelLabel(stage: number): string {
  const level = getStageLevel(stage);

  switch (level) {
    case STAGE_LEVEL.EASY:
      return 'かんたん';
    case STAGE_LEVEL.NORMAL:
      return 'ふつう';
    case STAGE_LEVEL.HARD:
      return 'むずかしい';
    case STAGE_LEVEL.EXPERT:
      return '最強';
    default:
      return 'ふつう';
  }
}

export function getUnlockedItems(stage: number) {
  const items = [];

  if (stage >= 3) {
    items.push(ITEM.DELETE);
  }

  if (stage >= 6) {
    items.push(ITEM.PUSH_DOWN);
  }

  if (stage >= 10) {
    items.push(ITEM.PUSH_RIGHT);
  }

  return items;
}

export function getStageItemRule(stage: number): 'normal' | 'select_one' {
  return stage >= 15 ? 'select_one' : 'normal';
}

export function canCpuUseItem(stage: number): boolean {
  return stage >= 40;
}

export function getCpuThinkingMs(stage: number): number {
  if (stage <= 10) return 650;
  if (stage <= 25) return 550;
  if (stage <= 45) return 450;
  return 350;
}

export function getCpuRandomness(stage: number): number {
  if (stage <= 10) return 0.45;
  if (stage <= 25) return 0.22;
  if (stage <= 45) return 0.1;
  return 0.03;
}

export function getCpuLookahead(stage: number): number {
  if (stage <= 10) return 0;
  if (stage <= 25) return 1;
  if (stage <= 45) return 2;
  return 2;
}

export function getStageConfig(stage: number): StageConfig {
  const safeStage = clampStage(stage);

  return {
    stage: safeStage,
    level: getStageLevel(safeStage),
    levelLabel: getStageLevelLabel(safeStage),
    cpuThinkingMs: getCpuThinkingMs(safeStage),
    cpuRandomness: getCpuRandomness(safeStage),
    cpuLookahead: getCpuLookahead(safeStage),
    cpuCanUseItem: canCpuUseItem(safeStage),
    unlockedItems: getUnlockedItems(safeStage),
    itemRule: getStageItemRule(safeStage),
  };
}

export function clampStage(stage: number): number {
  if (Number.isNaN(stage)) return 1;
  return Math.min(MAX_STAGE, Math.max(1, stage));
}

export function isFinalStage(stage: number): boolean {
  return clampStage(stage) >= MAX_STAGE;
}

export function getNextStage(stage: number): number {
  return clampStage(stage + 1);
}

export function getPrevStage(stage: number): number {
  return clampStage(stage - 1);
}