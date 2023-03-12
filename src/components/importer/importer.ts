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

export type ImporterOverrides = Record<
  string,
  (i: Importer, meta: PathMeta) => Promise<unknown> | unknown
>;

// eslint-disable-next-line @typescript-eslint/ban-types,@typescript-eslint/no-empty-function
const AsyncFunction = (async function () {} as Object).constructor;

export class Importer {
  private runtimeCache: Record<string, unknown> = {};
  private moduleOverrides: ImporterOverrides = {};
  readonly absolute = 'https://cdn.jsdelivr.net';

  registerModuleOverrides(moduleOverrides: ImporterOverrides): void {
    this.moduleOverrides = moduleOverrides;
  }

  isValidExtension(url: string): boolean {
    const lowerCaseUrl = url.toLowerCase();

    return /(\/\+esm|\.json)$/.test(lowerCaseUrl);
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
      console.error(`Error loading module ${this.absolute + url}: ${err}`);
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
    // @ts-expect-error this is unsafe
    return file.default ?? file;
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

  private fixESMFiles(source: string, url: string): string {
    const parsedSource = source
      .replace(
        /import\s+([A-Za-z$_]\S*)\s+from\s*["']([^"']+)["'][\s;]*/g,
        (match, name, url) => {
          return `const ${name} = await ___importDefault('${url}');`;
        }
      )
      .replace(
        /import\s*\*\s*as\s*([A-Za-z$_]\S*)\s+from\s*["']([^"']+)["'][\s;]*/g,
        (match, name, url) => {
          return `const ${name} = await ___importFile('${url}');`;
        }
      )
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
              return `exports.${exportParts[2].trim()} = ${exportParts[1].trim()};`;
            }
            return `exports.${name.trim()} = ${name.trim()};`;
          })
          .join('\n');
      })
      .replace(/\/\/# sourceMappingURL=\/.+/, '');

    return parsedSource + `\n\n//# sourceURL=${this.absolute}${url}`;
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
    console.log('Loading file:', this.absolute + url);

    const response = await fetch(this.absolute + url, {
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
