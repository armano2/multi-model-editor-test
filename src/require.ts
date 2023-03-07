interface RequireMapping {
  package: string;
  version: string;
  path: string;
  directories?: string[];
}

interface Require {
  (url: string): Record<string, unknown>;
  registerMapping: (mapping: RequireMapping[]) => void;
  cache: Record<string, unknown>;
  mapping: Record<string, string>;
  absolute: string;
  mocks: Record<string, () => unknown>;
}

function isValidExtension(url: string): boolean {
  const lowerCaseUrl = url.toLowerCase();

  return /\.(js|cjs|json)$/.test(lowerCaseUrl);
}

const requireRelative = function (parent: string): (url: string) => unknown {
  return function (url: string): unknown {
    if (url.startsWith('.')) {
      const parentUrl = parent.split('/');
      if (isValidExtension(parent)) {
        parentUrl.pop();
      }
      const urlParts = url.split('/');
      for (let i = 0; i < urlParts.length; i++) {
        if (urlParts[i] === '..') {
          parentUrl.pop();
        } else if (urlParts[i] !== '.') {
          parentUrl.push(urlParts[i]);
        }
      }
      url = parentUrl.join('/');
    }
    return window.require(url);
  };
};

function registerMapping(mappings: RequireMapping[]) {
  for (const mapping of mappings) {
    const url = `${mapping.package}@${mapping.version}`;
    for (const dir of mapping.directories || []) {
      window.require.mapping[
        mapping.package + '/' + dir
      ] = `${url}/${dir}/index.min.js`;
      window.require.mapping[url + '/' + dir] = `${url}/${dir}/index.min.js`;
    }
    window.require.mapping[mapping.package] = url + '/' + mapping.path;
  }
}

function cachedRequest(url: string) {
  const cache = localStorage.getItem(`require-cache--${url}`);
  if (cache) {
    return cache;
  }

  const X = new XMLHttpRequest();
  X.open('GET', window.require.absolute + url, false);
  X.send();
  if (X.status && X.status !== 200) {
    throw new Error(X.statusText);
  }

  const source = X.responseText;
  localStorage.setItem(`require-cache--${url}`, source);
  return source;
}

const require = function (url: string): unknown {
  console.log(url);
  if (url in window.require.mocks) {
    return window.require.mocks[url]();
  }
  if (url in window.require.mapping) {
    url = window.require.mapping[url];
  }
  if (!isValidExtension(url)) {
    url += '.js';
  }
  let exports = window.require.cache[url];
  if (!exports) {
    try {
      exports = {};
      let source = cachedRequest(url);
      if (url.endsWith('.json')) {
        exports = JSON.parse(source);
      } else {
        // fix (if saved form for Chrome Dev Tools)
        if (source.substr(0, 10) === '(function(') {
          let moduleStart = source.indexOf('{');
          const moduleEnd = source.lastIndexOf('})');
          const CDTComment = source.indexOf('//@ ');
          if (CDTComment > -1 && CDTComment < moduleStart + 6)
            moduleStart = source.indexOf('\n', CDTComment);
          source = source.slice(moduleStart + 1, moduleEnd - 1);
        }
        // fix, add comment to show source on Chrome Dev Tools
        source = `//@ sourceURL=${window.require.absolute}${url}\n${source}`;
        // according to node.js modules, create a module object
        const module = { id: url, uri: url, exports: exports };
        // create a Fn with module code, and 3 params: require, exports & module
        const anonFn = new Function('require', 'exports', 'module', source);
        // call the Fn, Execute the module code
        anonFn(requireRelative(url), exports, module);
        // cache obj exported by module
        exports = module.exports;
      }
      window.require.cache[url] = exports;
    } catch (err) {
      console.error(`Error loading module ${url}: ${err}`);
      throw err;
    }
  }
  return exports;
};

declare global {
  interface Window {
    require: Require;
  }
}

// @ts-ignore
window.require = require;
window.require.registerMapping = registerMapping;
window.require.cache = {};
window.require.mapping = {};
window.require.mocks = {};
window.require.absolute = '';

export {};
