import { useLocalStorage, useMedia } from 'react-use';
import { useEffect } from 'react';

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
    const callback = (e: CustomEvent) => {
      setColorMode(e.detail === 'dark' ? 'dark' : 'light');
    };

    window.addEventListener('themeChanged', callback);

    return () => {
      window.removeEventListener('themeChanged', callback);
    };
  }, []);

  return [
    colorMode!,
    (theme) => {
      setColorMode(theme);
      window.dispatchEvent(new CustomEvent('themeChanged', { detail: theme }));
    },
  ];
}

export default useColorMode;
