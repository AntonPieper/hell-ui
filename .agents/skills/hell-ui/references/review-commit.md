# Review And Commit

Read this for hell-ui review requests or when the user explicitly asks to commit.

## Review

- Inspect current files first. Treat review notes and issue text as claims until
  verified.
- For release, accessibility, API, package, or production-ready claims, run or
  cite the strongest relevant local command and name anything not run.
- Manual runtime findings should name the relevant
  `docs/architecture/manual-runtime-ownership.md` row and explain whether the
  row is wrong, untested, or missing a narrow follow-up.
- UI-visible review needs live-page Visual QA or an explicit blocker.
- Do not claim production readiness unless the evidence is current and
  boringly strong.

## Commit

- Commit only when asked.
- Inspect `git status` and `git diff`; include nested worktree or submodule
  status when the checkout uses them.
- Keep the diff atomic. Do not commit only a submodule pointer or sweep unrelated
  meta changes into product commits.
- Code or public behavior changes need fresh-context review before commit.
- Run or cite the validation that matches the diff.
- Use a conventional message and terse body: what changed, why, validation.

Completion criterion: a commit branch is ready when the diff is atomic, review
status is known, validation is recorded, and generated/local artifacts are not
staged.
