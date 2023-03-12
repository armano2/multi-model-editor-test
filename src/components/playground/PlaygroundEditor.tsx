import { loader } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import React, { useRef, useState } from 'react';
import { useMount } from 'react-use';

import { type EslintUtilsModule, importEslintUtils } from '../importer';
import Loader from '../layout/Loader';
import type { UpdateModel } from '../linter/types';
import PlaygroundLoaded from './PlaygroundLoaded';
import type { ErrorGroup, PlaygroundSystem } from './types';

export interface PlaygroundProps {
  readonly activeFile: string;
  readonly tsVersion: string;
  readonly tsEsVersion: string;
  readonly system: PlaygroundSystem;
  readonly onValidate: (markers: ErrorGroup[]) => void;
  readonly onUpdate: (model: UpdateModel) => void;
  readonly selectedRange?: [number, number];
}

function PlaygroundEditor(props: PlaygroundProps): JSX.Element {
  const [isLoading, setLoading] = useState<boolean>(true);
  const monaco = useRef<typeof Monaco>();
  const utils = useRef<EslintUtilsModule>();

  useMount(() => {
    loader.config({
      paths: {
        vs: `https://typescript.azureedge.net/cdn/${props.tsVersion}/monaco/min/vs`,
      },
    });

    // This has to be executed in proper order
    loader
      .init()
      .then((instance: typeof Monaco) => {
        monaco.current = instance;
        return importEslintUtils(props.tsEsVersion);
      })
      .then((instance) => {
        utils.current = instance;
        setLoading(false);
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.log('Unable to initialize editor', e);
      });
  });

  if (isLoading || !monaco.current || !utils.current) {
    return <Loader />;
  }

  return (
    <PlaygroundLoaded
      monaco={monaco.current}
      utils={utils.current}
      {...props}
    />
  );
}

export default PlaygroundEditor;
