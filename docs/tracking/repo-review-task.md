# Entrata Lease Audit Assistant: Repo Review & Refactor Tracker

## Repo Structure Audit Plan (2025-04-19)

### Goals

- Remove legacy, duplicate, or obsolete files and folders
- Merge or reorganize `notes` and `reference` for clarity and maintainability
- Ensure all documentation and tracking files are up to date and easy to find
- Prepare the repo for a clean, modern, and collaborative workflow

### Concrete Actions

- [x] Identify and list all legacy/obsolete files (e.g., old requirements, duplicate scripts, unused configs)
- [x] Remove or archive these files (move to `archive/` or delete if truly unnecessary)
- [x] Review `notes/` and `reference`:
  - [x] List contents of each
  - [x] Propose a merged structure (e.g., combine into `docs/` or keep as `notes/` with subfolders)
  - [x] Move/merge files accordingly, updating links and references
- [x] Ensure all tracking, checklist, and documentation files are current and not duplicated
- [x] Update README to reflect new structure and any major changes

### Rationale

- Reduces clutter and confusion for contributors
- Makes onboarding and navigation easier
- Ensures that only relevant, up-to-date files are maintained

### Progress Checklist (Structure Audit)

- [x] List all candidates for removal/archival
- [x] Propose merged doc/notes structure
- [x] Execute initial file/folder moves and deletions (notes/ migrated, archive/ created)
- [x] Migrate reference/ files (images, persistent, test plans migrated; duplicates archived)
- [x] Review/migrate error logs and webpages
- [x] Update documentation and README
- [x] Remove empty folders (final cleanup)
- [x] Final review for clarity and completeness

---

#### Migration Complete (2025-04-19)

- All documentation, images, trackers, and relevant files are now in `docs/`
- Obsolete and historical files are in `archive/`
- The `README.md` documents the new structure
- Old `notes/` and `reference/` folders have been removed
- Migration and refactor complete!

#### Migration Notes (2025-04-19)

- Created new `docs/` structure and base-level `archive/` folder
- Migrated all actionable notes/trackers to `docs/` (see guides/ and tracking/)
- Archived obsolete/historical files
- Migrated reference/ images, persistent, and test plans to docs/
- Archived duplicates, kept most up-to-date versions
- Migrated/reviewed error logs and webpages (minor tool errors handled automatically)
- README update and folder cleanup in progress
- Minor tool errors are being handled automatically unless a decision is needed

---

## Candidates for Removal/Archival (Initial Audit)

### notes/

- **chrome-identity-e2e.md**: Useful for E2E test best practices and Chrome identity stubbing. _Recommend: Keep (still relevant for E2E and CI)_
- **column-helpers-import-update.md**: Records the audit and update of column-helpers imports. _Recommend: Archive (historical, no longer actively useful)_
- **esm-test-suite-migration.md**: Documents ESM migration for Jest and test suite. _Recommend: Archive (historical, migration complete)_
- **fix-test-failures.md**: Tracks and resolves Jest/E2E test failures. _Recommend: Keep (useful for ongoing test maintenance)_
- **popup-ui-integration.md**: Outlines integration of column modules and helpers into popup UI. _Recommend: Keep (useful for ongoing UI work)_
- **popup-ui.md**: Tracks popup UI integration status and next steps. _Recommend: Keep (active UI integration)_
- **column-modules/list.md**: Implementation tracker for all column modules. _Recommend: Keep (useful for tracking)_
- **column-modules/F.md**: Detailed note for Column F implementation. _Recommend: Keep (column-specific, up to date)_

### reference/

- **Requirements.txt, Requirements_old.txt**: Old and new requirements. _Recommend: Archive old, review new for relevance_
- **column_implementation.txt**: Implementation details for columns. _Recommend: Archive if all info is in notes/list.md_
- **error logs, images, webpages, persistent**: Review contents; archive or clean up as needed.

### General

- Remove or archive any duplicate, outdated, or superseded files in `notes/` and `reference/`.
- Ensure all tracking/checklist files are up to date and not duplicated.

---

## Proposed Merged Doc/Notes Structure

### Rationale

- Reduce fragmentation and make all documentation, notes, and reference material easy to find.
- Encourage a single source of truth for implementation details, tracking, and onboarding docs.
- Make it easier for new contributors to navigate the project.

### Proposed Structure

```
docs/
  guides/           # How-to, onboarding, and process docs
  design/           # UI, UX, and architecture notes
  tracking/         # Implementation trackers, checklists, audit logs
  legacy/           # Archived/legacy docs (old requirements, migration notes, etc.)
  images/           # Screenshots, diagrams
  error-logs/       # (if still needed)
  ...
```

- Move all useful notes and reference files into the appropriate `docs/` subfolder
- Archive historical/obsolete files in `docs/legacy/`
- Place up-to-date trackers and checklists in `docs/tracking/`
- Move images, logs, and persistent reference material to `docs/images/`, `docs/error-logs/`, etc.

### Concrete Migration Steps

- [ ] Create `docs/` folder and subfolders as above
- [ ] Move all relevant files from `notes/` and `reference/` into `docs/`
- [ ] Archive obsolete/historical files in `docs/legacy/`
- [ ] Update all links and references in the codebase and README
- [ ] Remove old `notes/` and `reference/` folders if empty

---

## Task Overview

This document tracks the progress of the comprehensive repository review and refactor, including:

- Repo structure cleanup (remove old files, consider merging reference and notes folders)
- Code review (all sources, tests, scripts, configs, etc.) for best practices and outdated code
- Library/import review (remove unused dependencies, ensure clean imports)
- Documentation and tracking updates

---

## Progress Checklist

- [ ] Audit and update repo structure
- [ ] Merge or reorganize notes and reference folders (if applicable)
- [ ] Review all source files for structure, best practices, and outdated code
- [ ] Review all test files for coverage, structure, and relevance
- [ ] Review all scripts and configs for modern practices and necessity
- [ ] Audit all imports and libraries for unused or outdated dependencies
- [ ] Remove or archive old/unneeded files
- [ ] Update documentation and tracking files (list.md, notes, etc.)
- [ ] Final review and polish

---

## Notes

- Mark each item as complete when finished (move to Completed Tasks section below).
- Add findings, blockers, and decisions as you progress.

---

## Completed Tasks

- (none yet)

---

## Additional Suggestions

- Consider adding automated linting and formatting if not already present.
- Ensure all contributors are aware of new repo structure and conventions.
- Document any major decisions or folder changes in the README.

---

_This file will be updated as progress is made during the repo review/refactor process._
