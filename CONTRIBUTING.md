# Contributing to Tapestry Forge

## Commit Message Format

This project uses **Conventional Commits** for commit message formatting. All commits must follow the Conventional Commits specification.

### Format

```
<type>(<scope>): <imperative description>
```

- `<type>`: Required - one of the supported commit types
- `<scope>`: Optional - the scope of the change (e.g., component, feature area)
- `<imperative description>`: Required - describes the change in imperative mood, lowercase first letter

### Supported Commit Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(plans): add plan creation form` |
| `fix` | Bug fix | `fix(plans): preserve empty descriptions` |
| `refactor` | Code refactoring | `refactor(repositories): isolate JSON persistence` |
| `perf` | Performance improvement | `perf(rendering): optimize plan display` |
| `test` | Adding or updating tests | `test(plans): cover plan creation validation` |
| `docs` | Documentation changes | `docs(architecture): clarify repository boundaries` |
| `chore` | Maintenance tasks | `chore(deps): update Vue dependencies` |
| `build` | Build system changes | `build(vite): update configuration` |
| `ci` | CI configuration | `ci(github): add workflow` |
| `style` | Style changes | `style(components): format code` |

### Breaking Changes

Breaking changes must be indicated using one of these formats:

1. **Exclamation mark** in the type/scope:
   ```
   feat(plans)!: change plan persistence format
   ```

2. **BREAKING CHANGE footer**:
   ```
   feat(plans): change plan persistence format
   
   BREAKING CHANGE: existing stored plans require migration
   ```

## Setup

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js
- Git

### Installation

After cloning the repository, install dependencies and set up Git hooks:

```bash
# Install dependencies
bun install

# Install Git hooks
bun run hook:install
```

The hook installation script:
- Configures Git to use the project's shared hooks directory
- Is idempotent and can be run multiple times safely
- Sets up commit message validation

### Manual Hook Setup (Alternative)

If you prefer to set up hooks manually:

```bash
git config core.hooksPath .githooks
```

## Validation

### Test Commit Message Validation

You can test commit message validation before making actual commits:

```bash
# Test a valid commit message
echo "feat(plans): add plan creation form" | bun run commitlint

# Test an invalid commit message (should fail)
echo "fixed stuff" | bun run commitlint || echo "Correctly rejected"
```

### Valid Examples

```bash
# With scope
feat(plans): add plan creation form

# Without scope
fix: resolve validation issue

# Breaking change with !
feat(plans)!: change plan persistence format

# Breaking change with footer
feat(plans): change plan persistence format

BREAKING CHANGE: existing stored plans require migration

# Multi-line description
feat(plans): add plan creation form

This implements the new plan creation UI component
with proper validation and error handling.
```

### Invalid Examples

```bash
# No type
fixed stuff

# Invalid type
wip: work in progress

# Uppercase first letter
Fixed: validation issue

# No description
feat:
```

## Versioning

This project uses **Semantic Versioning (SemVer)** with the format `MAJOR.MINOR.PATCH`.

### Current Version

The application version is defined in `package.json` under the `version` field.

During pre-1.0 development:
- Version format: `0.x.y`
- `0.x.0`: New backward-compatible feature milestone
- `0.x.y`: Backward-compatible bug fix or maintenance release
- Breaking changes may require a new minor version while below `1.0.0`

### Release Tags

Releases are tagged with the format `vX.Y.Z`:

```
v0.1.0
v0.2.0
v0.2.1
v1.0.0
```

**Note**: Release tags are created manually during the release process, not automatically.

## Development Workflow

1. Create a feature/topic branch from `master`
2. Make changes following Conventional Commits
3. Push branch and create Pull Request
4. After approval, merge to `master`
5. Release preparation and tagging happens manually

## Troubleshooting

### Hook Not Working

If commit validation is not working:

1. Verify hooks are installed:
   ```bash
   git config core.hooksPath
   ```
   Should return `.githooks`

2. Check if the hook exists and is executable:
   ```bash
   ls -la .githooks/commit-msg
   ```

3. Reinstall dependencies:
   ```bash
   bun install
   ```

4. Reinstall hooks:
   ```bash
   bun run hook:install
   ```

### Dependency Issues

If you see `npx` or `commitlint` command not found:

```bash
# Ensure dependencies are installed
bun install

# Test commitlint directly
npx commitlint --help
```

## Additional Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- Project architecture and development guidelines are in the private AI repository

**Note**: The private `tapestry-forge-ai` repository contains the authoritative development policies. This document provides implementation-specific guidance for the public application repository.