import { copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { basename, join, relative, sep } from 'node:path';

/**
 * Copy report-guarded declarations beneath a synthetic node_modules package.
 * API Extractor then models guarded sibling entrypoints as external package
 * contracts instead of following them as part of the current working package.
 * Callers must not mirror an entrypoint without a corresponding API baseline.
 */
export function createApiReportDeclarationMirror({
  mirrorFolder,
  packageName,
  packageJsonFullPath,
  entrypoints,
}) {
  rmSync(mirrorFolder, { recursive: true, force: true });

  const packageFolder = join(mirrorFolder, 'node_modules', ...packageName.split('/'));
  const typesFolder = join(packageFolder, 'types');
  mkdirSync(typesFolder, { recursive: true });
  copyFileSync(packageJsonFullPath, join(packageFolder, 'package.json'));

  return new Map(
    entrypoints.map((entrypoint) => {
      const mirroredDeclarationPath = join(typesFolder, basename(entrypoint.declarationFilePath));
      copyFileSync(entrypoint.declarationFilePath, mirroredDeclarationPath);
      return [entrypoint.specifier, mirroredDeclarationPath];
    }),
  );
}

/** Exact mappings prevent package self-resolution from pulling sibling declarations local. */
export function apiReportSiblingPaths({
  baseUrl,
  currentSpecifier,
  entrypoints,
  mirroredDeclarations,
}) {
  return Object.fromEntries(
    entrypoints
      .filter((entrypoint) => entrypoint.specifier !== currentSpecifier)
      .map((entrypoint) => [
        entrypoint.specifier,
        [toPosixPath(relative(baseUrl, mirroredDeclarations.get(entrypoint.specifier)))],
      ]),
  );
}

function toPosixPath(path) {
  return path.split(sep).join('/');
}
