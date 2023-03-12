import { createSystem } from '@typescript/vfs';
import type * as Monaco from 'monaco-editor';
import type * as ts from 'typescript';

import type { PlaygroundSystem } from '../playground/types';
import type { ConfigModel } from '../playground/types';
import { debounce } from '../util/debounce';

export async function addLibFiles(
  system: PlaygroundSystem,
  monaco: typeof Monaco
): Promise<void> {
  const worker = await monaco.languages.typescript.getTypeScriptWorker();
  const workerInstance = await worker();
  const libs = await workerInstance.getLibFiles();
  if (libs) {
    for (const [name, content] of Object.entries(libs)) {
      system.writeFile('/' + name, content);
    }
  }
}

export function createFileSystem(config: ConfigModel): PlaygroundSystem {
  const files = new Map<string, string>();
  files.set(`/.eslintrc`, config.eslintrc);
  files.set(`/tsconfig.json`, config.tsconfig);
  files.set(`/file.${config.fileType}`, config.code);

  const fileWatcherCallbacks = new Map<string, Set<ts.FileWatcherCallback>>();
  const directoryWatcherCallback = new Set<ts.DirectoryWatcherCallback>();

  const system = createSystem(files) as PlaygroundSystem;

  system.watchFile = (path, callback, pollingInterval): ts.FileWatcher => {
    const cb = pollingInterval ? debounce(callback, pollingInterval) : callback;

    let handle = fileWatcherCallbacks.get(path);
    if (!handle) {
      handle = new Set();
      fileWatcherCallbacks.set(path, handle);
    }
    handle.add(cb);

    return {
      close: (): void => {
        const handle = fileWatcherCallbacks.get(path);
        if (handle) {
          handle.delete(cb);
        }
      },
    };
  };

  system.watchDirectory = (path, callback): ts.FileWatcher => {
    directoryWatcherCallback.add(callback);
    return {
      close: (): void => {
        directoryWatcherCallback.delete(callback);
      },
    };
  };

  const triggerCallbacks = (
    path: string,
    type: ts.FileWatcherEventKind
  ): void => {
    fileWatcherCallbacks.get(path)?.forEach((item) => item(path, type));
    if (type !== 1) {
      directoryWatcherCallback.forEach((item) => item(path));
    }
  };

  system.deleteFile = (fileName): void => {
    files.delete(fileName);
    triggerCallbacks(fileName, 1);
  };

  system.writeFile = (fileName, contents): void => {
    if (!contents) {
      contents = '';
    }
    const file = files.get(fileName);
    if (file === contents) {
      // do not trigger callbacks if the file has not changed
      return;
    }
    files.set(fileName, contents);
    triggerCallbacks(fileName, file ? 2 : 0);
  };

  system.removeFile = (fileName): void => {
    files.delete(fileName);
  };

  return system;
}
