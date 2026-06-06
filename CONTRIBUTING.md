<!-- generated-by: gsd-doc-writer -->

# Contributing to Foto Segundo

Thank you for your interest in contributing to Foto Segundo! We follow a disciplined development process to maintain the "Midnight Luxury" standard of our platform.

## Development Setup

Before making your first contribution, please review our setup guides:

- [GETTING-STARTED.md](docs/GETTING-STARTED.md) — Prerequisites and installation.
- [DEVELOPMENT.md](docs/DEVELOPMENT.md) — Detailed development workflow and build commands.

## Coding Standards

- **TypeScript:** Strict typing is mandatory. No `any` without a documented reason.
- **Components:** Follow the Atomic Design pattern where possible.
- **Design Tokens:** Use CSS variables from `index.css` for all colors and spacing to maintain theme consistency.
- **Testing:** New features must include corresponding E2E tests in the `e2e/` directory.

## Pull Request Guidelines

1. **Branching:** Branch off `dev` for all features (`feat/name`) and fixes (`fix/name`).
2. **Commits:** Use [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat: add new gallery filter`).
3. **Tests:** Ensure all tests pass locally using `npm test`.
4. **Documentation:** Update relevant `.md` files in `docs/` if your changes affect the public API or configuration.
5. **Review:** All PRs require at least one approval from a maintainer.

## Issue Reporting

- Use GitHub Issues to report bugs or suggest enhancements.
- **Bugs:** Include steps to reproduce, expected behavior, and screenshots if applicable.
- **Security:** For security vulnerabilities, please email the maintainers directly instead of opening a public issue.

---

© 2026 Foto Segundo. Built with passion for photography and technology.
