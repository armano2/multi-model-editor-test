import * as fs from 'node:fs/promises';

import fetch from 'cross-fetch';
import semver from 'semver';

interface FetchObject {
  package: string;
  downloads: Record<string, number>;
}

function sortAndFilter(
  downloads: Record<string, number>,
  allowList: string
): string[] {
  // get 10 most popular versions downloaded from npm
  return Object.entries(downloads)
    .sort(([, a], [, b]) => {
      return a === b ? 0 : a < b ? 1 : -1;
    })
    .filter(
      ([version]) =>
        !version.includes('-') && semver.satisfies(version, allowList)
    )
    .slice(0, 10)
    .map(([version]) => version)
    .sort(semver.rcompare);
}

async function getPackageStats(
  packageName: string,
  allowList: string
): Promise<string[]> {
  const encodedPackageName = encodeURIComponent(packageName);
  const response = await fetch(
    `https://api.npmjs.org/versions/${encodedPackageName}/last-week`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  );
  const result = (await response.json()) as FetchObject;
  return sortAndFilter(result.downloads, allowList);
}

async function main(): Promise<void> {
  const packages = await Promise.all([
    getPackageStats('@typescript-eslint/eslint-plugin', '^5.0.0'),
    getPackageStats('typescript', '^4.1.5'),
    // getPackageStats('eslint', '^6.0.0 || ^7.0.0 || ^8.0.0'),
  ]);

  const [eslintPlugin, typescript] = packages;
  const fileUrl = new URL(
    '../src/components/playground/packageVersions.json',
    import.meta.url
  );

  await fs.writeFile(
    fileUrl,
    JSON.stringify({ eslintPlugin, typescript }, null, 2) + '\n',
    'utf8'
  );
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exitCode = 1;
});
