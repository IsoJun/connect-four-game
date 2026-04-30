import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';

import { Skin } from '../logic/skins';

type SkinSelectorProps = {
  skins: Skin[];
  selectedSkinId: string;
  disabled?: boolean;
  onSelectSkin: (skinId: string) => void;
};

export function SkinSelector({
  skins,
  selectedSkinId,
  disabled = false,
  onSelectSkin,
}: SkinSelectorProps) {
  if (!skins || skins.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>コマスキン</Text>

      <View style={styles.row}>
        {skins.map((skin) => {
          const active = skin.id === selectedSkinId;

          return (
            <TouchableOpacity
              key={skin.id}
              style={[
                styles.skinButton,
                active && styles.skinButtonActive,
                disabled && styles.disabled,
              ]}
              disabled={disabled}
              onPress={() => onSelectSkin(skin.id)}
            >
              <View style={styles.previewRow}>
                <Image source={skin.red} style={styles.previewImage} />
                <Image source={skin.yellow} style={styles.previewImage} />
              </View>

              <Text
                style={[
                  styles.skinName,
                  active && styles.skinNameActive,
                ]}
              >
                {skin.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  skinButton: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 76,
  },
  skinButtonActive: {
    backgroundColor: '#ff7043',
  },
  previewRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  previewImage: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  skinName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#333',
  },
  skinNameActive: {
    color: '#ffffff',
  },
  disabled: {
    opacity: 0.45,
  },
});