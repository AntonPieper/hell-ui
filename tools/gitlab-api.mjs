// Transport for the two protected-`main` policy commands.
//
// The project this policy protects is never named in the tree: the host and
// credentials come from the environment, and the project from a variable CI
// already provides. That keeps a repository that still mirrors publicly free
// of internal infrastructure names, and lets the same command run against a
// scratch project without an edit.
//
// - `HELL_POLICY_PROJECT` — project id or URL-encoded path; falls back to
//   `CI_PROJECT_ID`.
// - `CI_API_V4_URL` + `HELL_POLICY_TOKEN` — direct HTTPS, for CI, where the
//   token is the read-only project access token the sweep uses. Setting the
//   URL without a token is an error rather than a silent fallback: a CI image
//   has no interactive credential to fall back to.
// - Neither set — the `glab` CLI supplies host and credentials from the
//   maintainer's own login.
//
// List endpoints page explicitly rather than through `glab --paginate`, whose
// output is a stream of JSON arrays rather than one document.

import { execFileSync } from 'node:child_process';

const perPage = 100;

/** @returns {string} the `projects/<ref>` prefix every policy path hangs off. */
export function resolveProjectPath() {
  const project = process.env.HELL_POLICY_PROJECT || process.env.CI_PROJECT_ID;
  if (!project) {
    throw new Error(
      'Set HELL_POLICY_PROJECT to the GitLab project id (or URL-encoded path) this policy ' +
        'protects. CI_PROJECT_ID is used when the command runs inside a pipeline.',
    );
  }
  return `projects/${encodeURIComponent(project)}`;
}

/** @returns {string} a one-line description of where the reads went. */
export function describeTransport() {
  return usesHttp()
    ? 'the GitLab REST API with HELL_POLICY_TOKEN'
    : 'the authenticated `glab` CLI';
}

/**
 * Read one object.
 *
 * @param {string} path API v4 path, without a leading slash.
 * @returns {Promise<object>}
 */
export async function apiGet(path) {
  return request('GET', path, null);
}

/**
 * Read every page of a collection.
 *
 * @param {string} path API v4 path, without a leading slash or query string.
 * @returns {Promise<object[]>}
 */
export async function apiList(path) {
  const entries = [];
  for (let page = 1; ; page += 1) {
    const separator = path.includes('?') ? '&' : '?';
    const batch = await request('GET', `${path}${separator}per_page=${perPage}&page=${page}`, null);
    if (!Array.isArray(batch)) {
      throw new Error(`Expected a collection from ${path}; got ${typeof batch}.`);
    }
    entries.push(...batch);
    if (batch.length < perPage) return entries;
  }
}

/**
 * Perform one write. Only the restoration command calls this.
 *
 * @param {'POST'|'PUT'|'DELETE'} method
 * @param {string} path
 * @param {object|null} body
 * @returns {Promise<object|null>}
 */
export async function apiSend(method, path, body) {
  return request(method, path, body);
}

function usesHttp() {
  return Boolean(process.env.CI_API_V4_URL);
}

async function request(method, path, body) {
  return usesHttp() ? httpRequest(method, path, body) : glabRequest(method, path, body);
}

async function httpRequest(method, path, body) {
  const token = process.env.HELL_POLICY_TOKEN;
  if (!token) {
    throw new Error(
      'CI_API_V4_URL is set but HELL_POLICY_TOKEN is not; the policy commands need a token with ' +
        'read access to project settings, protected branches, protected tags, and labels.',
    );
  }
  const base = process.env.CI_API_V4_URL.replace(/\/$/, '');
  const headers = { 'PRIVATE-TOKEN': token };
  if (body !== null) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${base}/${path}`, {
    method,
    headers,
    body: body === null ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${method} ${path} failed: ${response.status} ${response.statusText} ${text}`.trim());
  }
  return parseResponse(text, method, path);
}

function glabRequest(method, path, body) {
  const args = ['api', '--method', method, path];
  // `--input` sends the body verbatim without a content type, which the API
  // rejects with 415; glab does not add one for us.
  if (body !== null) args.push('--header', 'Content-Type: application/json', '--input', '-');
  let text;
  try {
    text = execFileSync('glab', args, {
      encoding: 'utf8',
      input: body === null ? undefined : JSON.stringify(body),
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (error) {
    const detail = error.stderr?.toString().trim() || error.message;
    throw new Error(`glab api ${method} ${path} failed: ${detail}`);
  }
  return parseResponse(text, method, path);
}

function parseResponse(text, method, path) {
  // A successful DELETE answers 204 with no body.
  if (text.trim() === '') return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${method} ${path} returned a body that is not JSON: ${error.message}`);
  }
}
