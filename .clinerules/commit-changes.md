## Brief overview
This rule file specifies that after completing any task, the changes should be committed to git with a descriptive commit message.

## Development workflow
- After completing a task, always commit the changes to the repository
- Use clear and descriptive commit messages that explain what was changed
- Include the file(s) modified in the commit
- Use present tense and imperative mood for commit messages (e.g., "feat: add X", "fix: resolve Y", "refactor: update Z")

## Commit message format
- Use conventional commit format: `<type>: <description>`
- Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`
- Example: `feat: filter checkout page to only show delivered orders`