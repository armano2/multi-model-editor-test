import { readPackageJSON } from './utils';

const packageVersions = new Map<string, string>();

async function getPackageVersion(packageName: string): Promise<string> {
  if (packageVersions.has(packageName)) {
    return packageVersions.get(packageName)!;
  }
  const packageJson = await readPackageJSON(packageName);
  packageVersions.set(packageName, packageJson.version);
  return packageJson.version;
}

export async function jsDeliverImports(result: string): Promise<string> {
  const exp =
    /import(\s+[A-Za-z${}_]\S*|\s*\*\s*as\s*([A-Za-z$_]\S*))\s+from\s*["']([^"']+)["'][\s;]*/g;

  const matches = result.matchAll(exp);

  for (const matchImport of matches) {
    const [text, name, , url] = matchImport;
    if (name.includes('${')) {
      // eslint-disable-next-line no-console
      console.warn(name, 'has invalid dependency', url);
      continue;
    }
    if (url.includes('{{')) {
      continue;
    }
    const match = /^(@[^/\s]+\/[^/\s]+|[^/\s]+)(.*)$/g.exec(url);
    if (!match) {
      throw new Error(`Unsupported import name: ${url}`);
    }
    const [, packageName, packagePath] = match;

    const version = await getPackageVersion(packageName);
    result = result.replaceAll(
      text,
      `import${name} from '/npm/${packageName}@${version}${packagePath}/+esm';`
    );
  }

  return result;
}
