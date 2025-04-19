# Fixing Test Failures

## Objective
- Resolve remaining Jest and E2E test failures

## Current Issues

### 1. Jest ColumnF Tests
- Error: `ColumnF.evaluate is not a function`
- `F.mjs` exports only `run` and `displayData`; tests call `evaluate`

### 2. AuditController Tests
- Error: `require is not defined` in ESM test file
- Tests use `require()` in `.test.mjs`, but project is ESM

### 3. Integration Tests for content.js
- `ENOENT: no such file or directory` for `src/js/content.js`
- Path mismatch: tests expect `src/js/content.js`, actual file exists at same path but mount point may be incorrect

### 4. E2E Tests (Puppeteer)
- `Extension target not found` when launching extension
- Launch args and waiting logic might not match extension build output

## Next Steps
1. **ColumnF**:
   - Export `evaluate` alias or update tests to call `run` and normalize return shape
2. **AuditController**:
   - Convert tests to use `import` instead of `require`
   - Adjust Jest config to support CJS or enable `require` shim
3. **Integration**:
   - Ensure `fs` is imported in tests
   - Verify test path resolution and project root
4. **E2E**:
   - Confirm extension directory and manifest
   - Adjust `launchExtensionWithServer` waiting criteria

*These notes track the investigation and tasks for making the full suite pass.*
