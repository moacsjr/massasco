## Brief overview
This rule file specifies the mandatory requirement to use Nx generators for creating applications, libraries, and plugins in the monorepo. Manual project creation by copying folders or creating files from scratch is strictly prohibited.

## Mandatory Project Creation Rule

Never create Nx applications, libraries, or plugins manually by copying folders or creating files from scratch.

Always use the official Nx generators.

Examples:

```sh
# Generate a React application
npx nx g @nx/react:app demo

# Generate a React library
npx nx g @nx/react:lib some-lib
```

For workspace-specific plugins, always use the corresponding workspace generator if one exists.

---

## Rationale

Nx generators automatically create and register:

* project.json
* tsconfig.json
* tsconfig.lib.json
* build targets
* lint targets
* test targets
* sourceRoot configuration
* workspace registration
* dependency graph metadata

Manual project creation frequently causes:

* missing project registration
* missing build targets
* invalid tsconfig inheritance
* missing path mappings
* inconsistent project names
* broken dependency graphs

---

## Validation

After generation:

```sh
nx show project <project-name>
```

must succeed.

---

## Exception

Manual creation is only allowed when:

1. No Nx generator exists for the desired project type.
2. The project structure cannot be produced by an existing generator.
3. The reason is documented in the implementation notes.

Otherwise, always use generators.

---

## Critical Rule

If a project was created manually and exhibits build, resolution, registration, or dependency-graph issues, regenerate it using the appropriate Nx generator before debugging application code.