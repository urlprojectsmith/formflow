import React from 'react';
import { useTheme } from './ThemeProvider';
import { THEME_OPTIONS } from './theme.constants';
import { Theme } from './theme.types';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, value: Theme, index: number) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      const previous = THEME_OPTIONS[(index - 1 + THEME_OPTIONS.length) % THEME_OPTIONS.length];
      setTheme(previous.value);
    }
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      const next = THEME_OPTIONS[(index + 1) % THEME_OPTIONS.length];
      setTheme(next.value);
    }
    if (event.key === 'Home') {
      event.preventDefault();
      setTheme(THEME_OPTIONS[0].value);
    }
    if (event.key === 'End') {
      event.preventDefault();
      setTheme(THEME_OPTIONS[THEME_OPTIONS.length - 1].value);
    }
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      setTheme(value);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Theme selector"
      className="theme-toggle"
    >
      {THEME_OPTIONS.map((option, index) => {
        const selected = theme === option.value;

        return (
          <button
            key={option.value}
            role="radio"
            type="button"
            aria-label={`Switch to ${option.label} theme`}
            aria-checked={selected}
            className={`theme-toggle-option ${selected ? 'is-active' : ''}`}
            onClick={() => setTheme(option.value)}
            onKeyDown={(event) => handleKeyDown(event, option.value, index)}
            tabIndex={selected ? 0 : -1}
          >
            <span aria-hidden="true">{option.icon}</span>
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};
