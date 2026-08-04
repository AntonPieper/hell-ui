# The daily drift sweep

A scheduled pipeline audits, every day, the two surfaces that can drift
without leaving a trace on this platform edition: the protected-`main`
policy and the published releases. The schedule sets
`PIPELINE_KIND=policy-sweep`, and that pipeline runs exactly one job —
`policy-sweep` — and nothing else; the pipeline-shape contract proves the
exclusivity in both directions.

The job replays two read-only checks:

| Half | Command | What it proves |
| --- | --- | --- |
| Policy | `pnpm verify:main-policy` | Live parity between `.gitlab/policy/protect-main.json` and the project's merge settings, protected branches, protected tags, and state labels ([`protected-main-policy.md`](./protected-main-policy.md)). |
| Releases | `pnpm verify:release-drift` | Every release, re-read via the API (never webhook payloads), exactly projects its tagged record: title `v<version>`, the tag's own commit, the byte-exact `.changes/<version>.md` bytes read at that commit, and exactly one `package`-type asset link naming the published registry package. |

Both halves always run, even when the first goes red, so one drifted surface
never hides what the other proved.

The sweep exists because protection rules can be deleted and releases edited
with no history anywhere: the sweep is the audit trail. A `v*` tag that
carries no release — a version that shipped before this machinery existed —
is reported as outside the audited domain, not as drift. Before the first
seeded release the release half simply reports that no releases exist yet.

## Reporting, never repairing

The sweep only reads. Drift is reported, never repaired: drift on a
protection surface or a release may be someone's deliberate change, and
repairing it silently would destroy the only evidence that it happened.
Restoration is always an explicit maintainer command, run outside CI:

```bash
pnpm restore:main-policy            # policy surfaces; --apply to write
pnpm restore:release -- <tag>       # print the release restoration plan
pnpm restore:release -- <tag> --apply
```

`restore:release` re-derives the projection from the tagged artifacts and
writes the exact bytes back: title, description, and the one package asset
link. Two drifts it deliberately refuses:

- A release naming the wrong commit means the tag itself moved. Where the
  tag belongs is a maintainer's call about refs, not a release edit, so the
  command explains and stops.
- A deleted release is not re-created here: re-run the tag pipeline's
  projection job, which creates the release and verifies what it stored.

Both commands run over the same transport selection as the policy commands
(see [`protected-main-policy.md`](./protected-main-policy.md)): in a
pipeline, `CI_API_V4_URL` plus `HELL_POLICY_TOKEN`; locally, the
authenticated `glab` CLI — which is where the write-capable credential
lives, and the only place restoration runs.

## The sweep's token

The sweep holds the project's one long-lived credential:
`HELL_POLICY_TOKEN`, a project access token stored as a CI/CD variable that
is **protected** (only pipelines on protected refs see it — the schedule
runs on `main`) and **masked** (never echoed into job logs).

| Property | Value | Why |
| --- | --- | --- |
| Scope | `read_api`, nothing else | The scope is what makes the token read-only: whatever its role, it cannot write through the API. |
| Role | Maintainer | The lowest role that can read every audited surface — the protected-branch and protected-tag reads are gated above Reporter on this edition. |
| Expiry | 12 months, the instance maximum | Expiry is the backstop, not the alarm: an expired token turns the sweep red the next morning, fail-closed, and the red job names the missing token. |

Rotation, on expiry or on any suspicion:

1. Mint the replacement: project settings → Access tokens, name
   `policy-sweep-read`, scope `read_api`, role Maintainer, longest allowed
   expiry.
2. Replace the value of the `HELL_POLICY_TOKEN` CI/CD variable, keeping
   protected + masked.
3. Revoke the old token, then play the sweep schedule once and watch it go
   green.

The write-capable credential never enters CI in any form; publication uses
`CI_JOB_TOKEN` only, and restoration runs from a maintainer's own login.

## Running the sweep on demand

The schedule owns the daily cadence; to run the same audit immediately, play
the schedule (CI/CD → Schedules → ▶) — the pipeline it creates is
indistinguishable from the nightly one. Locally, the two commands above run
against the live project through `glab` with no token at all.

Spot-checking the red path end to end is worth doing after material changes
to the machinery: edit one release's description in the UI, watch the played
sweep go red naming the byte difference, restore with
`pnpm restore:release -- <tag> --apply`, and watch the next play go green.
