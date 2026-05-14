// @ts-nocheck
import React from 'react';
import { View, Platform } from 'react-native';

import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';

// =========================
// 📸 スクショモード
// true で広告非表示
// =========================
const SCREENSHOT_MODE = true;

// =========================
// テスト広告ID
// =========================
const adUnitId =
  Platform.OS === 'ios'
    ? TestIds.BANNER
    : TestIds.BANNER;

type Props = {
  position?: 'top' | 'bottom';
};

export default function AdBanner({
  position = 'bottom',
}: Props) {

  // 📸 スクショ時は広告非表示
  if (SCREENSHOT_MODE) {
    return null;
  }

  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
        backgroundColor: '#ffffff',
      }}
    >
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      />
    </View>
  );
}