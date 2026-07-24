// Objective Change Fragment validation (ADR 0003).
//
// A Change Fragment records exactly one coherent Consumer Change. The
// objective contract is deliberately narrow: an allowed kind, a nonblank
// consumer-facing body, and a mandatory nonblank migration for Breaking.
// Concision and prose quality stay authoring and review responsibilities, so
// no character limits or extra metadata fields are enforced here, and
// multiline prose is accepted.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const changeKinds = ['Breaking', 'Added', 'Changed', 'Fixed', 'Security'];

const kindGuidance =
  'allowed kinds are Breaking, Added, Changed, Fixed, and Security; ' +
  'record removals as Breaking and deprecations as Changed';

function validateChangeFragment(content, label) {
  let fragment;
  try {
    fragment = parse(content);
  } catch (error) {
    return [`${label} must be valid YAML: ${error.message}`];
  }

  if (typeof fragment !== 'object' || fragment === null || Array.isArray(fragment)) {
    return [`${label} must be a YAML map with kind and body fields.`];
  }

  const errors = [];
  const kind = fragment.kind;
  if (typeof kind !== 'string' || !changeKinds.includes(kind)) {
    errors.push(`${label} has unknown kind ${formatValue(kind)}; ${kindGuidance}.`);
  }

  if (!isNonblankString(fragment.body)) {
    errors.push(`${label} must have a nonblank consumer-facing body.`);
  }

  if (kind === 'Breaking' && !isNonblankString(fragment.custom?.migration)) {
    errors.push(
      `${label} is a Breaking Consumer Change and must carry nonblank custom.migration guidance.`,
    );
  }

  return errors;
}

export function listUnreleasedFragments(unreleasedDir) {
  return readdirSync(unreleasedDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.ya?ml$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}

export function collectUnreleasedFragmentErrors(unreleasedDir, describePath = (path) => path) {
  if (!existsSync(unreleasedDir)) {
    return [`Missing ${describePath(unreleasedDir)} directory.`];
  }

  const errors = [];
  for (const name of listUnreleasedFragments(unreleasedDir)) {
    const fragmentPath = join(unreleasedDir, name);
    errors.push(...validateChangeFragment(readFileSync(fragmentPath, 'utf8'), describePath(fragmentPath)));
  }

  return errors;
}

function isNonblankString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function formatValue(value) {
  if (value === undefined) return '(missing)';
  return JSON.stringify(value);
}
