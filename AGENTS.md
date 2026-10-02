# Tapestry Forge Agent Instructions

## Project context

Tapestry Forge is a TypeScript/Vue 3 application using a local-first architecture.

The private `tapestry-forge-ai` repository contains the development rules, architecture guidance, planning material, and AI workflows used to develop this application.

## AI development guidance

The authoritative AI development documentation is located in:

`../tapestry-forge-ai`

Before making substantial changes, consult the relevant documentation there.

Do not copy the private AI documentation into this repository.

## Repository boundaries

- This repository contains the public Tapestry Forge application.
- `../tapestry-forge-ai` is private AI/development infrastructure.
- Do not commit private AI configuration or documentation to this repository.
- Do not modify the Git history or remotes of `tapestry-forge-ai` unless explicitly instructed.

## Development behaviour

1. Inspect existing code before introducing new abstractions.
2. Follow the architecture and development guidance in `../tapestry-forge-ai`.
3. Prefer existing project patterns over parallel patterns.
4. Do not invent APIs, domain rules, or requirements.
5. Keep changes minimal and cohesive.
6. Respect applicable architecture decisions.
7. Keep documentation synchronized with meaningful architectural changes.
8. Work on one planned implementation part at a time.
9. Validate changes before considering an implementation part complete.

## Planning and implementation

Implementation work should follow the project's commit-sized implementation plan.

Before implementing a feature:

1. Identify the relevant planning documentation.
2. Identify applicable architecture guidance.
3. Identify relevant ADRs.
4. Implement only the current planned part.
5. Validate the implementation.
6. Stop before starting the next planned part.

## Context management

Context Mode is available through the `context-mode` MCP server.

Use it when working with large amounts of repository content, documentation, command output, or indexed project context.

Prefer retrieving relevant documentation rather than loading the entire AI repository into the model context.