import fs from 'node:fs/promises';
import { createRequire } from 'node:module';

export function requireResolved(targetPath: string): string {
  return createRequire(import.meta.url).resolve(targetPath);
}

export interface PackageJson {
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

export async function readPackageJSON(
  packageName: string
): Promise<PackageJson> {
  const currentPackage = requireResolved(`${packageName}/package.json`);
  const content = await fs.readFile(currentPackage, 'utf-8');
  return JSON.parse(content) as PackageJson;
}
