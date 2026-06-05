export type AppTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'communium-theme';

export function getInitialThemeScript() {
  return `(() => {
    try {
      const storageKey = '${THEME_STORAGE_KEY}';
      const applyTheme = (theme) => {
        const root = document.documentElement;
        root.dataset.theme = theme;
        root.style.colorScheme = theme;
        window.localStorage.setItem(storageKey, theme);
        window.dispatchEvent(new CustomEvent('communium-theme-change', { detail: theme }));
      };
      const resolveTheme = () => {
        const stored = window.localStorage.getItem(storageKey);
        return stored === 'dark' || stored === 'light'
          ? stored
          : window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
      };
      const theme = resolveTheme();
      const root = document.documentElement;
      root.dataset.theme = theme;
      root.style.colorScheme = theme;
      document.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        const trigger = target.closest('[data-communium-theme-toggle]');
        if (!trigger) return;
        const current = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
        applyTheme(current === 'dark' ? 'light' : 'dark');
      }, true);
    } catch (error) {
      document.documentElement.dataset.theme = 'light';
      document.documentElement.style.colorScheme = 'light';
    }
  })();`;
}
