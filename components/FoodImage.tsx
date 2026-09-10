import { Image, StyleSheet, View } from 'react-native';

import { foodImageSource } from '../constants/foodImages';
import { colors, radii } from '../constants/theme';

type FoodImageProps = {
  imageKey?: string;
  size?: number;
};

export default function FoodImage({ imageKey, size = 64 }: FoodImageProps) {
  return (
    <View style={[styles.frame, { width: size, height: size, borderRadius: Math.min(radii.md, size / 4) }]}>
      <Image
        source={foodImageSource(imageKey)}
        style={{ width: size, height: size }}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
