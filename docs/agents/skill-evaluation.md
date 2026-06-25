# Skill Evaluation

This repo keeps the direct skill setup lean. The deprecated `hell-ui-meta`
workbench proved that project-specific skills helped quality, while the custom
agent-loop structure added maintenance and submodule overhead.

## Keep

- `.agents/skills/hell-ui` is the canonical project skill. It owns direct
  hell-ui workflow, architecture, docs, validation, review, and commit guidance.
- User-level generic skills can still be used when available, such as handoff,
  prototype, and terse communication modes. They do not need project-local
  copies.

## Folded into `hell-ui`

- Former `hell-ui-slice`: keep vertical-slice discipline, direct project
  commands, docs visual checks, and validation-ladder thinking.
- Former `hell-ui-review`: keep fresh-context review posture, release/a11y/API
  scrutiny, and evidence-first findings.
- Former `context7-docs`: keep the rule to use configured current docs before
  guessing framework or dependency APIs.
- Former `caveman-commit`: keep atomic conventional commits and terse commit
  bodies, without a separate project-local skill.
- Former `subagent-orchestration`: keep the rule that subagents are only used
  when explicitly requested and given bounded tasks.

## Retired with `hell-ui-meta`

- `ralph-loop`, living spec board automation, meta archive hygiene, Pi-only
  subagent workflows, and broad meta packaging validation remain historical.
  Future work should use GitHub Issues when task tracking is needed.
