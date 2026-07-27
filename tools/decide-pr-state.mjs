#!/usr/bin/env node
// Trusted PR-state decision entry point (ADR 0003).
//
// Consumed by the privileged pull_request_target workflow
// (.github/workflows/pr-state.yml). It reads label and changed-file metadata
// that the workflow captured from the GitHub REST API into JSON files, then
// reports the fixture-tested policy verdict from tools/pr-state-policy.mjs.
// It is dependency-free and runs from the trusted base checkout: nothing from
// the pull request is checked out, imported, evaluated, or executed here.

import { readFileSync } from 'node:fs';
import { evaluatePullRequestState } from './pr-state-policy.mjs';

const usage = 'Usage: node tools/decide-pr-state.mjs --labels <labels.json> --files <files.json>';

const options = parseArguments(process.argv.slice(2));
const labels = readLabelNames(options.labels);
const files = readJson(options.files, 'changed-file metadata');

const { state, errors } = evaluatePullRequestState({ labels, files });

console.log(`Labels: ${labels.join(', ') || '(none)'}`);
console.log(`Changed files: ${files.length}`);
console.log(`Claimed state: ${state ?? '(none)'}`);

if (errors.length > 0) {
  console.error('Pull-request state check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Pull-request state ok: exactly one state (${state}).`);

function parseArguments(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if ((flag !== '--labels' && flag !== '--files') || value === undefined) {
      console.error(usage);
      process.exit(2);
    }
    parsed[flag.slice(2)] = value;
  }
  if (!parsed.labels || !parsed.files) {
    console.error(usage);
    process.exit(2);
  }
  return parsed;
}

function readJson(path, description) {
  let content;
  try {
    content = readFileSync(path, 'utf8');
  } catch (error) {
    console.error(`Failed to read ${description} at ${path}: ${error.message}`);
    process.exit(2);
  }
  // `gh api --paginate --jq | jq --slurp` writes an empty stream when the
  // endpoint returns no entries; treat it as an empty list.
  if (content.trim() === '') return [];
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error(`${description} at ${path} must be valid JSON: ${error.message}`);
    process.exit(2);
  }
}

function readLabelNames(path) {
  const entries = readJson(path, 'label metadata');
  if (!Array.isArray(entries)) {
    console.error(`Label metadata at ${path} must be a JSON array.`);
    process.exit(2);
  }
  return entries.map((entry) =>
    typeof entry === 'object' && entry !== null && 'name' in entry ? entry.name : entry,
  );
}
