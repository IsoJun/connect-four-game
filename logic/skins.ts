export type SkinId =
  | 'normal'
  | 'metal'
  | 'neon'
  | 'gold'
  | 'master';

export type Skin = {
  id: SkinId;
  name: string;
  description: string;
  unlockStage: number;
  red: any;
  yellow: any;
};

export const DEFAULT_SKIN_ID: SkinId = 'normal';

export const SKINS: Skin[] = [
  {
    id: 'normal',
    name: 'ノーマル',
    description: '最初から使える基本のコマ',
    unlockStage: 1,
    red: require('../assets/images/skins/normal_red.png'),
    yellow: require('../assets/images/skins/normal_yellow.png'),
  },
  {
    id: 'metal',
    name: 'メタル',
    description: 'ステージ10クリアで解放',
    unlockStage: 10,
    red: require('../assets/images/skins/metal_red.png'),
    yellow: require('../assets/images/skins/metal_yellow.png'),
  },
  {
    id: 'neon',
    name: 'ネオン',
    description: 'ステージ25クリアで解放',
    unlockStage: 25,
    red: require('../assets/images/skins/neon_red.png'),
    yellow: require('../assets/images/skins/neon_yellow.png'),
  },
  {
    id: 'gold',
    name: 'ゴールド',
    description: 'ステージ45クリアで解放',
    unlockStage: 45,
    red: require('../assets/images/skins/gold_red.png'),
    yellow: require('../assets/images/skins/gold_yellow.png'),
  },
  {
    id: 'master',
    name: 'マスター',
    description: 'ステージ60クリアで解放',
    unlockStage: 60,
    red: require('../assets/images/skins/master_red.png'),
    yellow: require('../assets/images/skins/master_yellow.png'),
  },
];

export function getSkinById(id: string | null | undefined): Skin {
  return SKINS.find((skin) => skin.id === id) ?? SKINS[0];
}

export function getUnlockedSkins(maxUnlockedStage: number): Skin[] {
  return SKINS.filter((skin) => maxUnlockedStage >= skin.unlockStage);
}

export function isSkinUnlocked(
  skinId: string,
  maxUnlockedStage: number
): boolean {
  const skin = getSkinById(skinId);
  return maxUnlockedStage >= skin.unlockStage;
}

export function getNextLockedSkin(maxUnlockedStage: number): Skin | null {
  return (
    SKINS.find((skin) => maxUnlockedStage < skin.unlockStage) ?? null
  );
}

export function getSkinUnlockText(skin: Skin): string {
  if (skin.unlockStage <= 1) {
    return '最初から使用可能';
  }

  return `ステージ${skin.unlockStage}クリアで解放`;
}