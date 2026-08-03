// Fixtures for the secret-detection gate policy (GitLab migration).
//
// The corpus drives the report evaluator directly: findings shaped like the
// CE secrets analyzer's `gl-secret-detection-report.json` (schema 15.x)
// against the in-repo allowlist, including the fail-closed rejection of
// report and allowlist shapes the policy does not recognize. Nothing here
// reads a file or runs the analyzer.

import { evaluateSecretDetectionReport } from './secret-detection-policy.mjs';

// A finding as the analyzer emits it. The raw extract is the secret itself;
// fixtures carry one to prove the policy never lets it back out.
function finding({
  rule = 'gitlab_personal_access_token',
  file = 'config/service.env',
  line = 3,
  name = 'GitLab personal access token',
  severity = 'Critical',
} = {}) {
  return {
    id: 'f'.repeat(64),
    category: 'secret_detection',
    name,
    severity,
    raw_source_code_extract: 'glpat-SECRET-VALUE-DO-NOT-ECHO',
    location: { file, commit: { sha: '0000000' }, start_line: line },
    identifiers: [
      { type: 'gitleaks_rule_id', name: `Gitleaks rule ID ${rule}`, value: rule },
    ],
  };
}

function report(...vulnerabilities) {
  return { version: '15.2.4', vulnerabilities };
}

function allowlist(...entries) {
  return { entries };
}

const secretDetectionPolicyFixtures = [
  {
    name: 'an empty report with an empty allowlist is clean',
    report: report(),
    allowlist: allowlist(),
    expect: { active: [], suppressed: [] },
  },
  {
    name: 'a finding with no allowlist entry is active',
    report: report(finding()),
    allowlist: allowlist(),
    expect: {
      active: [
        {
          rule: 'gitlab_personal_access_token',
          path: 'config/service.env',
          line: 3,
          name: 'GitLab personal access token',
          severity: 'Critical',
        },
      ],
      suppressed: [],
    },
  },
  {
    name: 'an entry matching rule and path suppresses the finding and carries its reason',
    report: report(finding()),
    allowlist: allowlist({
      rule: 'gitlab_personal_access_token',
      path: 'config/service.env',
      reason: 'documented placeholder token in the consumer guide',
    }),
    expect: {
      active: [],
      suppressed: [
        {
          rule: 'gitlab_personal_access_token',
          path: 'config/service.env',
          line: 3,
          name: 'GitLab personal access token',
          severity: 'Critical',
          reason: 'documented placeholder token in the consumer guide',
        },
      ],
    },
  },
  {
    name: 'a matching rule under a different path stays active',
    report: report(finding({ file: 'src/other.ts' })),
    allowlist: allowlist({
      rule: 'gitlab_personal_access_token',
      path: 'config/service.env',
      reason: 'documented placeholder',
    }),
    expect: { active: [{ path: 'src/other.ts' }], suppressed: [] },
  },
  {
    name: 'a matching path under a different rule stays active',
    report: report(finding({ rule: 'aws_access_token', name: 'AWS access token' })),
    allowlist: allowlist({
      rule: 'gitlab_personal_access_token',
      path: 'config/service.env',
      reason: 'documented placeholder',
    }),
    expect: { active: [{ rule: 'aws_access_token' }], suppressed: [] },
  },
  {
    name: 'suppression is per finding, not per report',
    report: report(
      finding({ file: 'docs/example.md', line: 10 }),
      finding({ file: 'src/leak.ts', line: 20 }),
    ),
    allowlist: allowlist({
      rule: 'gitlab_personal_access_token',
      path: 'docs/example.md',
      reason: 'documented placeholder',
    }),
    expect: {
      active: [{ path: 'src/leak.ts', line: 20 }],
      suppressed: [{ path: 'docs/example.md', line: 10 }],
    },
  },
  {
    // A merge-request scan only sees the merge request's commits, so most
    // pipelines never meet the finding an entry documents — an unmatched
    // entry must never fail the gate.
    name: 'an unmatched allowlist entry is not an error',
    report: report(),
    allowlist: allowlist({
      rule: 'gitlab_personal_access_token',
      path: 'docs/example.md',
      reason: 'documented placeholder',
    }),
    expect: { active: [], suppressed: [] },
  },
  {
    // The gate prints into a CI log; the secret must never travel from the
    // report into the verdict, active or suppressed.
    name: 'verdict findings never carry the raw source extract',
    report: report(finding({ file: 'docs/example.md' }), finding({ file: 'src/leak.ts' })),
    allowlist: allowlist({
      rule: 'gitlab_personal_access_token',
      path: 'docs/example.md',
      reason: 'documented placeholder',
    }),
    expect: { neverContains: 'glpat-SECRET-VALUE-DO-NOT-ECHO' },
  },
  {
    name: 'a report that is not an object fails closed',
    report: null,
    allowlist: allowlist(),
    expect: { errors: ['report'] },
  },
  {
    name: 'a report without a vulnerabilities array fails closed',
    report: { version: '15.2.4' },
    allowlist: allowlist(),
    expect: { errors: ['vulnerabilities'] },
  },
  {
    name: 'a finding without a file path fails closed',
    report: report({ ...finding(), location: { commit: { sha: '0' } } }),
    allowlist: allowlist(),
    expect: { errors: ['file path'] },
  },
  {
    name: 'a finding without a gitleaks rule id fails closed',
    report: report({ ...finding(), identifiers: [{ type: 'cve', value: 'CVE-0' }] }),
    allowlist: allowlist(),
    expect: { errors: ['rule id'] },
  },
  {
    name: 'an allowlist that is not an object fails closed',
    report: report(),
    allowlist: [],
    expect: { errors: ['allowlist'] },
  },
  {
    name: 'an allowlist without an entries array fails closed',
    report: report(),
    allowlist: {},
    expect: { errors: ['entries'] },
  },
  {
    name: 'an allowlist entry missing its reason fails closed',
    report: report(),
    allowlist: allowlist({ rule: 'gitlab_personal_access_token', path: 'docs/example.md' }),
    expect: { errors: ['reason'] },
  },
  {
    name: 'an allowlist entry with an empty path fails closed',
    report: report(),
    allowlist: allowlist({ rule: 'gitlab_personal_access_token', path: '', reason: 'x' }),
    expect: { errors: ['path'] },
  },
  {
    // A typo like "file" for "path" must not become an entry that silently
    // never matches.
    name: 'an allowlist entry with an unknown key fails closed',
    report: report(),
    allowlist: allowlist({
      rule: 'gitlab_personal_access_token',
      file: 'docs/example.md',
      path: 'docs/example.md',
      reason: 'x',
    }),
    expect: { errors: ['unknown key'] },
  },
  {
    // Rejected metadata poisons the whole verdict: a half-read report must
    // not report the readable half as clean.
    name: 'a rejected report yields no findings at all',
    report: report(finding(), { ...finding(), identifiers: [] }),
    allowlist: allowlist(),
    expect: { active: [], suppressed: [], errors: ['rule id'] },
  },
];

export function runSecretDetectionPolicyFixtures() {
  const failures = [];

  for (const fixture of secretDetectionPolicyFixtures) {
    const verdict = evaluateSecretDetectionReport({
      report: fixture.report,
      allowlist: fixture.allowlist,
    });
    for (const failure of collectFixtureFailures(fixture.expect, verdict)) {
      failures.push(`secret-detection fixture "${fixture.name}": ${failure}`);
    }
  }

  return { failures, total: secretDetectionPolicyFixtures.length };
}

function collectFixtureFailures(expect, verdict) {
  const failures = [];

  if (expect.neverContains !== undefined) {
    if (JSON.stringify(verdict).includes(expect.neverContains)) {
      failures.push('the verdict leaked the raw source extract.');
    }
    return failures;
  }

  const expectedErrors = expect.errors ?? [];
  if (expectedErrors.length > 0) {
    if (verdict.errors.length === 0) {
      failures.push(`expected a rejection mentioning ${expectedErrors.join(', ')}; got a pass.`);
      return failures;
    }
    for (const needle of expectedErrors) {
      if (!verdict.errors.some((error) => error.includes(needle))) {
        failures.push(
          `expected an error mentioning "${needle}"; got: ${verdict.errors.join(' | ')}`,
        );
      }
    }
  } else if (verdict.errors.length > 0) {
    failures.push(`expected a pass; got errors: ${verdict.errors.join(' | ')}`);
  }

  for (const [key, expected] of Object.entries(expect)) {
    if (key === 'errors') continue;
    const actual = verdict[key];
    if (!Array.isArray(actual) || actual.length !== expected.length) {
      failures.push(
        `expected ${expected.length} ${key} finding(s), got ${JSON.stringify(actual)}.`,
      );
      continue;
    }
    expected.forEach((fields, index) => {
      for (const [field, value] of Object.entries(fields)) {
        if (actual[index][field] !== value) {
          failures.push(
            `${key}[${index}].${field}: expected ${JSON.stringify(value)}, ` +
              `got ${JSON.stringify(actual[index][field])}.`,
          );
        }
      }
    });
  }

  return failures;
}
