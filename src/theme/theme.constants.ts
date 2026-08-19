import { ThemeOption } from './theme.types';

export const THEME_STORAGE_KEY = 'formflow-theme';

export const THEME_OPTIONS: ThemeOption[] = [
  { value: 'light', label: 'Light', icon: '\u2600\ufe0f' },
  { value: 'dark', label: 'Dark', icon: '\ud83c\udf19' },
  { value: 'colour', label: 'Colour', icon: '\ud83c\udfa8' },
];
