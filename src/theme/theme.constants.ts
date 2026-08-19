import { ThemeOption } from './theme.types';

export const THEME_STORAGE_KEY = 'formflow-theme';

export const THEME_OPTIONS: ThemeOption[] = [
  { value: 'light', label: 'Light', icon: '☀' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'colour', label: 'Colour', icon: '🎨' },
];
