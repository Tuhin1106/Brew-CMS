import type { ImageSourcePropType } from 'react-native';

export const FOOD_IMAGE_KEYS = [
  'cappuccino',
  'espresso',
  'garlic-toast',
  'butter-chicken',
  'veg-biryani',
  'brownie',
  'cold-brew',
  'bhurji',
  'aam-panna',
  'mutton-kosha',
  'sandwich',
  'pasta',
  'cooler',
  'cake',
  'default',
] as const;

export type FoodImageKey = (typeof FOOD_IMAGE_KEYS)[number];

export const FOOD_IMAGES: Record<FoodImageKey, ImageSourcePropType> = {
  cappuccino: require('../assets/food/cappuccino.png'),
  espresso: require('../assets/food/espresso.png'),
  'garlic-toast': require('../assets/food/garlic-toast.png'),
  'butter-chicken': require('../assets/food/butter-chicken.png'),
  'veg-biryani': require('../assets/food/veg-biryani.png'),
  brownie: require('../assets/food/brownie.png'),
  'cold-brew': require('../assets/food/cold-brew.png'),
  bhurji: require('../assets/food/bhurji.png'),
  'aam-panna': require('../assets/food/aam-panna.png'),
  'mutton-kosha': require('../assets/food/mutton-kosha.png'),
  sandwich: require('../assets/food/sandwich.png'),
  pasta: require('../assets/food/pasta.png'),
  cooler: require('../assets/food/cooler.png'),
  cake: require('../assets/food/cake.png'),
  default: require('../assets/food/default.png'),
};

const EMOJI_TO_KEY: Record<string, FoodImageKey> = {
  '☕': 'cappuccino',
  '🍵': 'espresso',
  '🥤': 'cold-brew',
  '🥪': 'sandwich',
  '🍛': 'veg-biryani',
  '🍳': 'bhurji',
  '🥗': 'pasta',
  '🍰': 'cake',
  '🍫': 'brownie',
  '🥐': 'sandwich',
  '🍕': 'default',
  '🍜': 'pasta',
  '🥭': 'aam-panna',
};

export function foodImageSource(key?: string): ImageSourcePropType {
  if (key && key in FOOD_IMAGES) {
    return FOOD_IMAGES[key as FoodImageKey];
  }
  return FOOD_IMAGES.default;
}

export function resolveImageKey(value?: string): FoodImageKey {
  if (value && value in FOOD_IMAGES) {
    return value as FoodImageKey;
  }
  if (value && EMOJI_TO_KEY[value]) {
    return EMOJI_TO_KEY[value];
  }
  return 'default';
}
