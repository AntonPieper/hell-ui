# The protected `main` policy as code

`.gitlab/policy/protect-main.json` is the checked-in source of truth for the
enforcement-relevant settings on the project that hosts `main`: the merge
settings behind the merge-request contract, the protected `main` rule, the
standing `v*` protected-tag rule, the fork-pipeline and variable-override
settings, and the two merge-request state labels.

The file exists because this platform edition has no server-side record of
what its own protection *should* be. A protected-tag rule can be deleted
without a trace, a merge setting can be relaxed in a settings page, and
nothing anywhere says it used to be otherwise. The file says so, and
`pnpm verify:main-policy` is what turns that claim into evidence.

## What the file records

| Surface | Recorded | Read from |
| --- | --- | --- |
| Merge settings | Merge method, squash option and template, the pipeline-succeeds and discussions-resolved gates, merge-on-skipped-pipeline | `GET projects/:id` |
| Fork and variable settings | Fork pipelines in the parent project, minimum role for variable overrides | `GET projects/:id` |
| Protected branches | Every rule, with one access level per field and the force-push flag | `GET projects/:id/protected_branches` |
| Protected tags | Every rule; `v*` is the standing rule that stands in for tag immutability | `GET projects/:id/protected_tags` |
| State labels | `no-consumer-change` and `release-preparation`, with colour and description | `GET projects/:id/labels` |

Protected branches and tags are recorded exhaustively: a rule on the project
that the file does not record is drift, because an unrecorded protection rule
is one nobody agreed to. Labels are a floor, not a census — the tracker
carries triage labels this policy has no opinion about.

The list of recorded project settings is closed in both directions. Dropping
a key from the file is an error rather than a silent decision to stop
enforcing it, and adding one is an error until it is named in
`tools/main-policy.mjs`. That is the whole point of a policy file: it cannot
quietly shrink.

## Posture

The file carries a `posture` word, and the word is checked against the `main`
push level:

| Posture | `main` push access | Why |
| --- | --- | --- |
| `window` | `maintainer` | The transition window needs a maintainer push for the manual sync. |
| `end-state` | `no-one` | Everything reaches `main` through a merge request. |

Flipping posture means editing the word and the level in the same commit, and
applying the same change live. An edit to one without the other fails
`--local`, before anything touches a project — a half-done flip is the failure
worth engineering against, because it is the one that looks fine.

## Verifying

```bash
pnpm verify:main-policy          # local coherence + live API evidence
pnpm verify:main-policy --local  # coherence and policy fixtures only, no network
```

The local half runs in the static-contract job; it needs no credentials. The
live half reads all four surfaces and reports every difference, including
access-level grants to a single user, group, or deploy key — the exception
grants that defeat the rule they sit on.

Point the commands at a project through the environment, never a checked-in
name:

| Variable | Meaning |
| --- | --- |
| `HELL_POLICY_PROJECT` | Project id or URL-encoded path. Falls back to `CI_PROJECT_ID` in a pipeline. |
| `CI_API_V4_URL` + `HELL_POLICY_TOKEN` | Direct REST transport, for CI. Setting the URL without a token fails rather than falling back. |
| neither | The authenticated `glab` CLI supplies host and credentials. |

## Restoring

```bash
pnpm restore:main-policy          # print the plan, write nothing
pnpm restore:main-policy --apply  # write it
```

Restoration is a separate command a maintainer runs deliberately.
Verification never repairs on its way past: drift on a protection surface may
be someone's deliberate change, and repairing it silently would destroy the
only evidence that it happened. Read the plan, then decide whether the
project is wrong or the file is.

The plan is derived from the same comparison the verifier reports, so it can
only touch surfaces the verifier checks, and every drift it reports has a
named repair. After writing, the command re-reads all four surfaces and fails
if anything still differs.

One sharp edge: this edition has no partial update for protected branch and
tag rules, so a drifted rule is deleted and recreated. The ref is unprotected
between those two requests. The command says so before it writes; run it when
nobody is pushing.

## Changing the policy

Change the file in a reviewed merge request, then apply it with
`pnpm restore:main-policy --apply`. The file and the live project are meant to
agree at every point in time, so the two halves belong to one change, not to a
plan to reconcile them later.
