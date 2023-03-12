import { useCallback, useEffect, useState } from 'react';

import { fromJson, toJson } from '../config/utils';
import type { PlaygroundSystem } from '../playground/types';

function readJsonFile<T>(system: PlaygroundSystem, fileName: string): T {
  const tsconfig = system.readFile(fileName) ?? '{}';
  return fromJson(tsconfig) as T;
}

export function useSystemFile<T>(
  system: PlaygroundSystem,
  fileName: string
): [T, (value: T) => void] {
  const [json, setJson] = useState<T>(() => readJsonFile(system, fileName));

  useEffect(() => {
    system.watchFile(fileName, (fileName) => {
      try {
        setJson(readJsonFile(system, fileName));
      } catch (e) {
        // suppress errors
      }
    });
  }, [system, fileName]);

  const updateJson = useCallback(
    (value: T) => {
      setJson(value);
      system.writeFile(fileName, toJson(value));
    },
    [system, fileName]
  );

  return [json, updateJson];
}
