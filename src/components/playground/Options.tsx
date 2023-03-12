import React, { useCallback, useEffect } from 'react';

import { ReactComponent as CopyIcon } from '../../icons/copyFiled.svg';
import { ReactComponent as ExternalLinkIcon } from '../../icons/externalLink.svg';
import useColorMode from '../hooks/useColorMode';
import useDebouncedToggle from '../hooks/useDebouncedToggle';
import Checkbox from '../inputs/Checkbox';
import Dropdown from '../inputs/Dropdown';
import Tooltip from '../inputs/Tooltip';
import ActionLabel from '../layout/ActionLabel';
import Expander from '../layout/Expander';
import InputLabel from '../layout/InputLabel';
import { esTsVersions, tsVersions } from './config';
import { createMarkdown, createMarkdownParams } from './lib/markdown';
import type { ConfigModel } from './types';

interface PlaygroundMenuProps {
  readonly config: ConfigModel;
  readonly setConfig: (cfg: Partial<ConfigModel>) => void;
}

function Options({ config, setConfig }: PlaygroundMenuProps): JSX.Element {
  const [colorMode, setColorMode] = useColorMode();
  const [copyLink, setCopyLink] = useDebouncedToggle<boolean>(false);
  const [copyMarkdown, setCopyMarkdown] = useDebouncedToggle<boolean>(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', colorMode ?? 'light');
  }, [colorMode]);

  const copyLinkToClipboard = useCallback(() => {
    void navigator.clipboard
      .writeText(document.location.toString())
      .then(() => {
        setCopyLink(true);
      });
  }, [setCopyLink]);

  const copyMarkdownToClipboard = useCallback(() => {
    void navigator.clipboard.writeText(createMarkdown(config)).then(() => {
      setCopyMarkdown(true);
    });
  }, [setCopyMarkdown, config]);

  const openIssue = useCallback((): void => {
    const params = createMarkdownParams(config);

    window
      .open(
        `https://github.com/typescript-eslint/typescript-eslint/issues/new?${params}`,
        '_blank'
      )
      ?.focus();
  }, [config]);

  return (
    <>
      <Expander label="Info">
        <InputLabel name="theme">
          <Checkbox
            name="theme"
            checked={colorMode === 'dark'}
            onChange={(value): void => setColorMode(value ? 'dark' : 'light')}
          />
        </InputLabel>
        <InputLabel name="TypeScript">
          <Dropdown
            name="ts-version"
            options={tsVersions}
            value={config.ts}
            onChange={(ts): void => setConfig({ ts })}
          />
        </InputLabel>
        <InputLabel name="TSEslint">
          <Dropdown
            name="ts-version"
            options={esTsVersions}
            value={config.tse}
            onChange={(tse): void => setConfig({ tse })}
          />
        </InputLabel>
      </Expander>
      <Expander label="Options">
        <InputLabel name="Source type">
          <Dropdown
            name="sourceType"
            value={config.sourceType ?? 'module'}
            onChange={(sourceType): void => setConfig({ sourceType })}
            options={['script', 'module']}
          />
        </InputLabel>
        <InputLabel name="File type">
          <Dropdown
            name="fileType"
            value={config.fileType ?? 'ts'}
            onChange={(fileType): void => setConfig({ fileType })}
            options={['ts', 'tsx', 'js', 'jsx', 'd.ts']}
          />
        </InputLabel>
      </Expander>
      <Expander label="Actions">
        <ActionLabel name="Copy link" onClick={copyLinkToClipboard}>
          <Tooltip open={copyLink} text="Copied">
            <CopyIcon />
          </Tooltip>
        </ActionLabel>
        <ActionLabel name="Copy Markdown" onClick={copyMarkdownToClipboard}>
          <Tooltip open={copyMarkdown} text="Copied">
            <CopyIcon />
          </Tooltip>
        </ActionLabel>
        <ActionLabel name="Report as Issue" onClick={openIssue}>
          <ExternalLinkIcon />
        </ActionLabel>
      </Expander>
    </>
  );
}

export default Options;
