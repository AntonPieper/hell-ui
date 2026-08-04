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

A recorded label must be a label *on this project* and must not be archived.
The labels endpoint also returns labels inherited from the parent group, and
an archived label is hidden from the picker — either would otherwise answer to
the right name while being unable to carry the assertion the contract reads it
for.

An access-level surface the policy does not record — `unprotect_access_levels`,
which this edition does not expose but a licence change would — reads as drift
rather than being ignored, so a new bypass surface announces itself instead of
arriving silently.

Protected branches and tags are recorded exhaustively: a rule on the project
that the file does not record is drift, because an unrecorded protection rule
is one nobody agreed to. It is reported, never removed — see *Restoring*.
Labels are a floor, not a census: the tracker carries triage labels this
policy has no opinion about.

The list of recorded project settings is closed in both directions. Dropping
a key from the file is an error rather than a silent decision to stop
enforcing it, and adding one is an error until it is named in
`tools/policy/main-policy.mjs`. That is the whole point of a policy file: it cannot
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
`pnpm test:main-policy`, before anything touches a project — a half-done flip
is the failure worth engineering against, because it is the one that looks
fine.

## Verifying

```bash
pnpm test:main-policy    # document coherence and policy fixtures, no network
pnpm verify:main-policy  # live parity across all four surfaces
```

`test:main-policy` runs in the static-contract job and needs no credentials:
it proves the checked-in document is a coherent posture, which is what makes
a posture change safe to review. `verify:main-policy` reads all four surfaces
and reports every difference, including access-level grants to a single user,
group, or deploy key — the exception grants that defeat the rule they sit on.
It also runs daily, unattended, as the policy half of the scheduled drift
sweep ([`drift-sweep.md`](./drift-sweep.md)).

Point the commands at a project through the environment, never a checked-in
name:

| Variable | Meaning |
| --- | --- |
| `HELL_POLICY_PROJECT` | Project id, or the path as you would write it (`group/project`) — encoding is applied for you, and an already-encoded value is refused. Falls back to `CI_PROJECT_ID` in a pipeline. |
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
only touch surfaces the verifier checks. After writing, the command re-reads
all four surfaces and fails if anything it meant to repair still differs.

One drift it will not repair: a protected branch or tag rule the policy does
not record. Removing a protection someone else added is a judgement about
their intent, not a repair, so the command lists those rules and leaves them
alone — even while it fixes everything else. Record the rule in the policy if
it belongs there, or remove it by hand if it does not.

One sharp edge worth knowing exactly. A protected branch takes a partial
update for its flags, so drift confined to `allow_force_push` is repaired in
place and the branch is never unprotected. Everything else means replacement —
access levels are not updatable on this edition (the parameters are accepted
and ignored), and protected tags have no update endpoint at all — so the rule
is deleted and recreated, and the ref is unprotected between those two
requests. The command says which of the two it is going to do before it
writes.

If the recreate fails, the command says so, names the ref that is unprotected
right now, and exits nonzero. Re-running is safe: the plan is recomputed from
what the project actually looks like.

## Changing the policy

Change the file in a reviewed merge request, then apply it with
`pnpm restore:main-policy --apply`. The file and the live project are meant to
agree at every point in time, so the two halves belong to one change, not to a
plan to reconcile them later.
