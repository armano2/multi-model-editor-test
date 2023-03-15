/* eslint-disable
    @typescript-eslint/no-unsafe-assignment,
    @typescript-eslint/no-unsafe-member-access,
    @typescript-eslint/no-unsafe-return
*/

export interface PathMeta {
  url: string;
  package: string;
  importName: string;
  version: string;
  file: string;
}

export type ImporterOverride = (
  i: Importer,
  meta: PathMeta
) => Promise<unknown> | unknown;

export type ImporterOverrides = Record<string, ImporterOverride>;

// eslint-disable-next-line @typescript-eslint/ban-types,@typescript-eslint/no-empty-function
const AsyncFunction = (async function () {} as Object).constructor;

export class Importer {
  private runtimeCache: Record<string, unknown> = {};
  private moduleOverrides: ImporterOverrides = {};
  readonly absolute = 'https://cdn.jsdelivr.net';

  registerModuleOverrides(moduleOverrides: ImporterOverrides): void {
    this.moduleOverrides = moduleOverrides;
  }

  registerModuleOverride(name: string, override: ImporterOverride): void {
    this.moduleOverrides[name] = override;
  }

  isValidExtension(url: string): boolean {
    const lowerCaseUrl = url.toLowerCase();

    return url.startsWith('http') || /(\/\+esm|\.json)$/.test(lowerCaseUrl);
  }

  parsePathMeta(url: string): PathMeta | null {
    const matched = url.match(/^\/npm\/(.+)@([^/]+)(\/.*)$/);
    if (matched) {
      const file = matched[3].replace(/\/\+esm$/, '');
      return {
        url,
        importName: matched[1] + file,
        package: matched[1],
        version: matched[2],
        file: file,
      };
    }
    // console.error('Unable to resolve package metadata:', url);
    return null;
  }

  async executeModule(url: string, source: unknown): Promise<unknown> {
    try {
      if (url.endsWith('.json')) {
        return source;
      } else {
        const exports = {};
        // according to node.js modules, create a module object
        const module = { id: url, uri: url, exports: exports };
        // create a Fn with module code, and 3 params: require, exports & module
        const anonFn = await AsyncFunction(
          '___importFile',
          '___importDefault',
          'exports',
          'module',
          source
        );
        // call the Fn, Execute the module code
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        await anonFn(
          this.importFile.bind(this),
          this.importDefault.bind(this),
          exports,
          module
        );
        // runtimeCache obj exported by module
        return exports;
      }
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions,no-console
      console.error(`Error loading module ${this.makeAbsoluteUrl(url)}`);
      // eslint-disable-next-line no-console
      console.error(err);
      throw err;
    }
  }

  async importFiles<T extends unknown[]>(
    urls: string[],
    useCache?: boolean
  ): Promise<T> {
    const responses = [];
    for (const url of urls) {
      responses.push(await this.importFile(url, useCache));
    }
    return responses as T;
  }

  async importDefault<T = Record<string, unknown>>(
    url: string,
    useCache?: boolean
  ): Promise<T> {
    const file = await this.importFile(url, useCache);
    // console.log('importDefault', file, url);
    // if ('__esModule' in file) {
    //   // @ts-expect-error this is unsafe
    //   return (file.default as T) ?? file;
    // }
    // @ts-expect-error this is unsafe
    return (file.default as T) ?? file;
  }

  async importFile<T = Record<string, unknown>>(
    url: string,
    useCache?: boolean
  ): Promise<T> {
    if (!this.isValidExtension(url)) {
      url += '/+esm';
    }

    const pathMeta = this.parsePathMeta(url);
    if (pathMeta) {
      if (pathMeta.importName in this.moduleOverrides) {
        return this.moduleOverrides[pathMeta.importName](this, pathMeta) as T;
      }
      if (url in this.moduleOverrides) {
        return this.moduleOverrides[url](this, pathMeta) as T;
      }
    }

    if (url in this.runtimeCache) {
      return this.runtimeCache[url] as T;
    }

    const response = await this.cachedRequest(url, useCache);
    const executedModule = await this.executeModule(url, response);
    this.runtimeCache[url] = executedModule;
    return executedModule as T;
  }

  private parseImportSpecifier(name: string): {
    type: 'star' | 'normal';
    value: string;
  } {
    name = name.trim();
    if (name.startsWith('{')) {
      return {
        type: 'normal',
        value: name.replace(/\s+as\s+/g, ':'),
      };
    }
    if (name.startsWith('*')) {
      return {
        type: 'star',
        value: name.replace(/^\*\s*as/g, ''),
      };
    }
    return {
      type: 'normal',
      value: name,
    };
  }

  private fixESMFiles(source: string, url: string): string {
    // This is far from perfect, we need to find a better way to do this
    const parsedSource = source
      .replace(
        /import\s*([^"'\n]+)\s*from\s*["'](\/npm\/[^"']+)["']\s*;?/g,
        (match, names: string, url) => {
          const importValue = this.parseImportSpecifier(names);
          if (importValue.type === 'star') {
            return `const ${importValue.value} = await ___importFile('${url}');`;
          }
          return `const ${importValue.value} = await ___importDefault('${url}');`;
        }
      )
      // .replace(
      //   /import\s+([A-Za-z$_]\S*)\s+from\s*["']([^"']+)["'][\s;]*/g,
      //   (match, name, url) => {
      //     return `const ${name} = await ___importDefault('${url}');`;
      //   }
      // )
      // .replace(
      //   /import\s*\*\s*as\s*([A-Za-z$_]\S*)\s+from\s*["']([^"']+)["'][\s;]*/g,
      //   (match, name, url) => {
      //     return `const ${name} = await ___importFile('${url}');`;
      //   }
      // )
      .replace(
        /export\s+default\s*([A-Za-z$_][^\s;]*)/g,
        (match, name: string) => {
          // TODO: this can be inside of string??
          if (name === 'null') {
            return '';
          }
          return `exports.default = ${name};`;
        }
      )
      .replace(/export\s*{([^}]+)}[\s;]*/g, (match, names: string) => {
        return names
          .split(',')
          .map((name) => {
            const exportParts =
              /([A-Za-z$_]\S*)\s+as\s+([A-Za-z$_][^\s;]*)/.exec(name);
            if (exportParts) {
              const part2 = exportParts[2].trim();
              const moduleIm =
                part2 === 'default' ? `exports.__esModule = true;` : '';
              return `exports.${exportParts[2].trim()} = ${exportParts[1].trim()};${moduleIm}`;
            }
            return `exports.${name.trim()} = ${name.trim()};`;
          })
          .join('\n');
      })
      .replace(/\/\/# sourceMappingURL=\/.+/, '');

    return parsedSource + `\n\n//# sourceURL=${this.absolute}${url}`;
  }

  private makeAbsoluteUrl(url: string): string {
    if (url.startsWith('http')) {
      return url;
    }
    return this.absolute + url;
  }

  private async cachedRequest(
    url: string,
    useCache?: boolean
  ): Promise<unknown> {
    if (useCache !== false) {
      const cached = await this.getCached(url);
      if (cached) {
        return cached;
      }
    }

    // eslint-disable-next-line no-console
    console.log('Loading file:', this.makeAbsoluteUrl(url));

    const response = await fetch(this.makeAbsoluteUrl(url), {
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error(`${response.url} - ${response.statusText}`);
    }
    let out: string;
    if (url.endsWith('.json')) {
      out = await response.json();
      await this.setCached(url, JSON.stringify(out));
    } else {
      out = await response.text();
      out = this.fixESMFiles(out, url);
      if (useCache !== false) {
        await this.setCached(url, out);
      }
    }

    return out;
  }

  private async setCached(url: string, value: string): Promise<void> {
    if ('caches' in window) {
      const cacheInstance = await caches.open('playground-cache');
      await cacheInstance.put(url, new Response(value));
    } else {
      // fallback to localstorage
      localStorage.setItem(`playground-cache--${url}`, value);
    }
  }

  private async getCached(url: string): Promise<unknown | undefined> {
    if ('caches' in window) {
      const cacheInstance = await caches.open('playground-cache');
      const response = await cacheInstance.match(url);

      if (url.endsWith('.json')) {
        return await response?.json();
      }
      return await response?.text();
    }

    // fallback to localstorage
    return localStorage.getItem(`playground-cache--${url}`) ?? undefined;
  }
}
