// Secret-detection gate policy (GitLab migration).
//
// The CE Secret-Detection template only writes a report — on that tier the
// analyzer records findings without failing on them — so the gate job replays
// `gl-secret-detection-report.json` through this evaluator and fails on every
// finding the in-repo allowlist does not cover. Fail-closed like the
// merge-request state policy: a report or allowlist shape this module does
// not recognize is an error, never a pass, and rejected metadata poisons the
// whole verdict rather than passing the readable half. Verdict findings are
// rebuilt from named fields and never carry `raw_source_code_extract`: the
// gate prints into a CI log, and the log must never echo the secret itself.
// Dependency-free and pure — file reading lives in the gate entry point.

// An allowlist entry names one documented false positive: the gitleaks rule
// it trips and the file it lives in, with the reason a reviewer needs. Line
// numbers are deliberately not part of the match — edits above the finding
// must not resurrect it — and unknown keys are rejected so a typo cannot
// become an entry that silently never matches.
const allowlistEntryKeys = ['rule', 'path', 'reason'];

export function evaluateSecretDetectionReport({ report, allowlist }) {
  const errors = [
    ...collectAllowlistErrors(allowlist),
    ...collectReportErrors(report),
  ];
  if (errors.length > 0) return { active: [], suppressed: [], errors };

  const active = [];
  const suppressed = [];
  report.vulnerabilities.forEach((vulnerability, index) => {
    const finding = describeFinding(vulnerability, index, errors);
    if (finding === null) return;
    const entry = allowlist.entries.find(
      (candidate) => candidate.rule === finding.rule && candidate.path === finding.path,
    );
    if (entry === undefined) active.push(finding);
    else suppressed.push({ ...finding, reason: entry.reason });
  });

  if (errors.length > 0) return { active: [], suppressed: [], errors };
  return { active, suppressed, errors };
}

function collectShapeErrors(value, noun, field) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return [`The ${noun} is not an object. Refusing to decide from unrecognized metadata.`];
  }
  if (!Array.isArray(value[field])) {
    return [`The ${noun} has no ${field} array. Refusing to decide from unrecognized metadata.`];
  }
  return [];
}

function collectReportErrors(report) {
  return collectShapeErrors(report, 'analyzer report', 'vulnerabilities');
}

function collectAllowlistErrors(allowlist) {
  const errors = collectShapeErrors(allowlist, 'allowlist', 'entries');
  if (errors.length > 0) return errors;
  allowlist.entries.forEach((entry, index) => {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      errors.push(`Allowlist entry ${index} is not an object.`);
      return;
    }
    for (const key of Object.keys(entry)) {
      if (!allowlistEntryKeys.includes(key)) {
        errors.push(
          `Allowlist entry ${index} has unknown key ${JSON.stringify(key)}; entries take ` +
            `exactly ${allowlistEntryKeys.join(', ')}.`,
        );
      }
    }
    for (const key of allowlistEntryKeys) {
      if (typeof entry[key] !== 'string' || entry[key] === '') {
        errors.push(`Allowlist entry ${index} needs a non-empty string ${key}.`);
      }
    }
  });
  return errors;
}

// A finding the allowlist cannot address — no rule id, no file path — cannot
// be suppressed, so it must not be reportable either way: it rejects the
// verdict instead of guessing.
function describeFinding(vulnerability, index, errors) {
  const file = vulnerability?.location?.file;
  const identifiers = Array.isArray(vulnerability?.identifiers) ? vulnerability.identifiers : [];
  const rule = identifiers.find((identifier) => identifier?.type === 'gitleaks_rule_id')?.value;

  if (typeof file !== 'string' || file === '' || typeof rule !== 'string' || rule === '') {
    errors.push(
      `Report finding ${index} carries no gitleaks rule id and file path to match against ` +
        'the allowlist. Refusing to decide from unrecognized metadata.',
    );
    return null;
  }

  const line = vulnerability.location.start_line;
  return {
    rule,
    path: file,
    line: typeof line === 'number' ? line : null,
    name: typeof vulnerability.name === 'string' ? vulnerability.name : rule,
    severity: typeof vulnerability.severity === 'string' ? vulnerability.severity : 'Unknown',
  };
}
