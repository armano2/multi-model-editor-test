import { useEffect } from 'react';
import { useLocalStorage, useMedia } from 'react-use';

export type SupportedTheme = 'dark' | 'light';

export type UseColorModeType = [
  colorMode: SupportedTheme,
  setColorMode: (theme: SupportedTheme) => void
];

function useColorMode(): UseColorModeType {
  const isDarkOS = useMedia('(prefers-color-scheme: dark)');
  const [colorMode, setColorMode] = useLocalStorage<SupportedTheme>(
    'useColorMode',
    isDarkOS ? 'dark' : 'light'
  );

  useEffect(() => {
    const callback = (e: Event): void => {
      setColorMode((e as CustomEvent).detail === 'dark' ? 'dark' : 'light');
    };

    window.addEventListener('themeChanged', callback);

    return () => {
      window.removeEventListener('themeChanged', callback);
    };
  }, [setColorMode]);

  return [
    colorMode!,
    (theme): void => {
      setColorMode(theme);
      window.dispatchEvent(new CustomEvent('themeChanged', { detail: theme }));
    },
  ];
}

export default useColorMode;
