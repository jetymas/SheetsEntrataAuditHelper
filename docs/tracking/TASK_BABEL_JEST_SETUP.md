# Task: Babel + Jest Setup for ESM Compatibility

## Objective
Enable robust, future-proof Jest testing for modern JavaScript (ESM) by integrating Babel into the test workflow. This will ensure the `jest` global is available and all ESM features work as expected.

---

## Problem-Solving Process (psp)

### 1. Examine the Problem
- Jest ESM mode does not reliably inject the `jest` global, causing test failures when using ESM (.mjs) files.

### 2. Set Goals
- Use Babel to transpile ESM code for Jest.
- Ensure all Jest features and globals work as intended.
- Maintain a clean, modern, and maintainable setup.

### 3. Break Down the Problem
- [ ] Add a Babel config at the project root.
- [ ] Update Jest config to use Babel for JS/ESM files.
- [ ] Update/remove the test script to remove experimental flags.
- [ ] Ensure setup files use ESM or CJS as appropriate.
- [ ] Remove manual jest global workarounds.
- [ ] Test and verify everything works.

### 4. Determine the Optimal Solution
- Use `babel-jest` and `@babel/preset-env` for all JS/ESM files.
- Use a root-level `babel.config.js`.
- Use Jest's `transform` config for Babel.
- Remove unnecessary experimental flags from npm scripts.

### 5. Review for Improvements
- Document all changes and rationale in this file and TODO.md.
- Add a smoke test to catch config issues early.

### 6. Write Notes in Tracking
- Track all changes in this doc and TODO.md.

### 7. Execute the Solution
- See implementation steps below.

---

## Implementation Steps

1. **Create `babel.config.js` at the project root:**
   ```js
   module.exports = {
     presets: [
       ['@babel/preset-env', { targets: { node: 'current' } }]
     ]
   };
   ```
2. **Update `jest.config.mjs`:**
   - Add/modify the `transform` property:
     ```js
     transform: {
       "^.+\\.m?[jt]sx?$": "babel-jest"
     },
     extensionsToTreatAsEsm: [".js", ".mjs"],
     ```
   - Ensure `testEnvironment`, `setupFilesAfterEnv`, and other relevant settings are correct.
3. **Update/remove the test script in `package.json`:**
   - Change to:
     ```json
     "test": "jest"
     ```
   - Remove `--experimental-vm-modules`.
4. **Convert setup files to ESM or CJS as appropriate:**
   - Ensure all imports/exports use the correct syntax for the file type.
5. **Remove manual jest global workarounds from setup files.**
6. **Run tests and verify:**
   - All tests should have access to the `jest` global and pass as expected.
7. **Document results and update TODO.md.**

---

## Progress Tracking
- [ ] babel.config.js created
- [ ] jest.config.mjs updated
- [ ] package.json script updated
- [ ] setup files checked/converted
- [ ] manual jest global removed
- [ ] tests passing
- [ ] documentation updated
