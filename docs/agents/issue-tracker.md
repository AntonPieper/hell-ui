# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues in `AntonPieper/hell-ui`.
Use the `gh` CLI for issue operations from this repository root.

## Conventions

- Create an issue: `gh issue create --title "..." --body "..."`
- Read an issue: `gh issue view <number> --comments`
- List issues: `gh issue list --state open --json number,title,body,labels,comments`
- Comment on an issue: `gh issue comment <number> --body "..."`
- Apply or remove labels: `gh issue edit <number> --add-label "..."` /
  `gh issue edit <number> --remove-label "..."`
- Close an issue: `gh issue close <number> --comment "..."`

Infer the repository from `git remote -v`; `gh` does this automatically inside
this clone.

## Pull requests as a triage surface

PRs as a request surface: no.

Do not feed external PRs into the triage queue unless this file is deliberately
updated. Collaborator PRs should be reviewed as pull requests, not treated as
incoming feature requests.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.
