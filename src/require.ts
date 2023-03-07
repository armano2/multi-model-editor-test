class Importer {
  cache: Record<string, unknown> = {};
  mocks: Record<string, () => unknown> = {};

  readonly absolute = 'https://cdn.jsdelivr.net';

  isValidExtension(url: string): boolean {
    const lowerCaseUrl = url.toLowerCase();

    return /(\/\+esm|\.json)$/.test(lowerCaseUrl);
  }

  importFile(url: string, useCache = true): any {
    if (url in this.mocks) {
      return this.mocks[url]();
    }
    if (!this.isValidExtension(url)) {
      url += '/+esm';
    }
    let exports = this.cache[url];
    if (!exports) {
      try {
        exports = {};
        let source = this.cachedRequest(url, useCache);
        if (url.endsWith('.json')) {
          exports = JSON.parse(source);
        } else {
          // according to node.js modules, create a module object
          const module = { id: url, uri: url, exports: exports };
          // create a Fn with module code, and 3 params: require, exports & module
          const anonFn = new Function('require', 'exports', 'module', source);
          // call the Fn, Execute the module code
          anonFn(this.importFile.bind(this), exports, module);
          // cache obj exported by module
          exports = module.exports;
        }
        this.cache[url] = exports;
      } catch (err) {
        console.error(`Error loading module ${this.absolute + url}: ${err}`);
        throw err;
      }
    }
    return exports;
  }

  fixESMFiles(source: string, url: string) {
    source += `\n\n//@ sourceURL=${this.absolute}${url}`;
    return source
      .replace(
        /import\s+([A-Za-z$_]\S*)\s+from\s*["']([^"']+)["'][\s;]*/g,
        (match, name, url) => {
          return `const ${name} = require('${url}');`;
        }
      )
      .replace(
        /import\s*\*\s*as\s*([A-Za-z$_]\S*)\s+from\s*["']([^"']+)["'][\s;]*/g,
        (match, name, url) => {
          return `const ${name} = require('${url}');`;
        }
      )
      .replace(
        /export\s+default\s*([A-Za-z$_][^\s;]*)/g,
        (match, name: string) => {
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
      });
  }

  cachedRequest(url: string, useCache = true) {
    if (useCache) {
      const cache = window.localStorage.getItem(`require-cache--${url}`);
      if (cache) {
        return cache;
      }
    }

    console.log('Loading file:', this.absolute + url);

    const X = new XMLHttpRequest();
    X.open('GET', this.absolute + url, false);
    X.send();
    if (X.status && X.status !== 200) {
      throw new Error(X.statusText);
    }

    const source = this.fixESMFiles(X.responseText, url);

    if (useCache) {
      window.localStorage.setItem(`require-cache--${url}`, source);
    }
    return source;
  }

  importFiles(urls: string[], useCache = true): any[] {
    return urls.map((url) => this.importFile(url, useCache));
  }
}

export const importer = new Importer();
