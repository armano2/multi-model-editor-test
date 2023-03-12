import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string';
import { useCallback, useEffect, useState } from 'react';

import { toJson } from '../config/utils';
import type { ConfigModel, ShowASTOptions } from '../playground/types';
import { hasOwnProperty } from '../util/has-own-property';

function writeQueryParam(value: string | null): string {
  return (value && compressToEncodedURIComponent(value)) || '';
}

function readQueryParam(value: string | null, fallback: string): string {
  return (value && decompressFromEncodedURIComponent(value)) || fallback;
}

function readShowAST(value: string | null): ShowASTOptions {
  switch (value) {
    case 'es':
    case 'ts':
    case 'scope':
      return value;
  }
  return value ? 'es' : false;
}

function toJsonConfig(cfg: unknown, prop: string): string {
  return toJson({ [prop]: cfg });
}

function readLegacyParam(
  data: string | null,
  prop: string
): string | undefined {
  try {
    return toJsonConfig(JSON.parse(readQueryParam(data, '{}')), prop);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e, data, prop);
  }
  return undefined;
}

const parseStateFromUrl = (hash: string): Partial<ConfigModel> | undefined => {
  if (!hash) {
    return;
  }

  try {
    const searchParams = new URLSearchParams(hash);

    let eslintrc: string | undefined;
    if (searchParams.has('eslintrc')) {
      eslintrc = readQueryParam(searchParams.get('eslintrc'), '');
    } else if (searchParams.has('rules')) {
      eslintrc = readLegacyParam(searchParams.get('rules'), 'rules');
    }

    let tsconfig: string | undefined;
    if (searchParams.has('tsconfig')) {
      tsconfig = readQueryParam(searchParams.get('tsconfig'), '');
    } else if (searchParams.has('tsConfig')) {
      tsconfig = readLegacyParam(
        searchParams.get('tsConfig'),
        'compilerOptions'
      );
    }

    // TODO: this is not ideal, and needs some improvements
    let code = searchParams.has('code')
      ? readQueryParam(searchParams.get('code'), '')
      : '';
    let code2 = searchParams.has('code2')
      ? readQueryParam(searchParams.get('code2'), '')
      : '';
    if (searchParams.has('jsx')) {
      code2 = code;
      code = '';
    }

    return {
      ts: searchParams.get('ts') ?? undefined,
      showAST: readShowAST(searchParams.get('showAST')),
      sourceType:
        searchParams.get('sourceType') === 'script' ? 'script' : 'module',
      code: code,
      code2: code2,
      eslintrc: eslintrc ?? '',
      tsconfig: tsconfig ?? '',
    };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(e);
  }
  return undefined;
};

const writeStateToUrl = (newState: ConfigModel): string | undefined => {
  try {
    const searchParams = new URLSearchParams();
    searchParams.set('ts', newState.ts.trim());
    searchParams.set('tse', newState.tse.trim());
    if (newState.sourceType === 'script') {
      searchParams.set('sourceType', newState.sourceType);
    }
    if (newState.showAST) {
      searchParams.set('showAST', newState.showAST);
    }
    searchParams.set('code', writeQueryParam(newState.code));
    searchParams.set('code2', writeQueryParam(newState.code2));
    searchParams.set('eslintrc', writeQueryParam(newState.eslintrc));
    searchParams.set('tsconfig', writeQueryParam(newState.tsconfig));
    return searchParams.toString();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(e);
  }
  return undefined;
};

const retrieveStateFromLocalStorage = (): Partial<ConfigModel> | undefined => {
  try {
    const configString = window.localStorage.getItem('config');
    if (!configString) {
      return undefined;
    }

    const config: unknown = JSON.parse(configString);
    if (typeof config !== 'object' || !config) {
      return undefined;
    }

    const state: Partial<ConfigModel> = {};
    if (hasOwnProperty('ts', config)) {
      const ts = config.ts;
      if (typeof ts === 'string') {
        state.ts = ts;
      }
    }
    if (hasOwnProperty('tse', config)) {
      const tse = config.tse;
      if (typeof tse === 'string') {
        state.tse = tse;
      }
    }

    if (hasOwnProperty('showAST', config)) {
      const showAST = config.showAST;
      if (typeof showAST === 'string') {
        state.showAST = readShowAST(showAST);
      }
    }

    return state;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(e);
  }
  return undefined;
};

const writeStateToLocalStorage = (newState: ConfigModel): void => {
  const config: Partial<ConfigModel> = {
    ts: newState.ts,
    showAST: newState.showAST,
  };
  window.localStorage.setItem('config', JSON.stringify(config));
};

function useHashState(
  initialState: ConfigModel
): [ConfigModel, (cfg: Partial<ConfigModel>) => void] {
  const [hash, setHash] = useState<string>(() => window.location.hash.slice(1));
  const [state, setState] = useState<ConfigModel>(() => ({
    ...initialState,
    ...retrieveStateFromLocalStorage(),
    ...parseStateFromUrl(hash),
  }));

  useEffect(() => {
    const onHashChange = (): void => {
      const newHash = window.location.hash.slice(1);
      setHash(newHash);
    };

    window.addEventListener('popstate', onHashChange);
    return (): void => {
      window.removeEventListener('popstate', onHashChange);
    };
  }, []);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.info('[State] hash change detected', hash);

    const newState = parseStateFromUrl(hash);
    if (newState) {
      setState((oldState) => ({ ...oldState, ...newState }));
    }
  }, [hash]);

  const updateState = useCallback(
    (cfg: Partial<ConfigModel>) => {
      // eslint-disable-next-line no-console
      console.info('[State] updating config diff', cfg);

      const newState = { ...state, ...cfg };

      const newHash = writeStateToUrl(newState);
      if (window.location.hash.slice(1) !== newHash) {
        writeStateToLocalStorage(newState);
        setState(newState);

        const url = `${window.location.pathname}#${newHash}`;

        if (cfg.ts || cfg.tse) {
          window.location.href = url;
          window.location.reload();
        } else {
          window.history.pushState(undefined, document.title, url);
        }
      }
    },
    [state]
  );

  return [state, updateState];
}

export default useHashState;
