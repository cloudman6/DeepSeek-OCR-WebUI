---
description: Test-Driven Development (TDD) workflow for new features and bug fixes.
---

Use this workflow when modifying existing code to add features, fix bugs, or perform refactoring. This complement `generate-tests.md` by focusing on iterative development.

### Prerequisites
- Target source file and its existing `.test.ts` file must be identified.
- Requirement or Bug report is clearly understood.

### Steps

1. **Context Analysis**
   - Read the source file and existing tests to understand current behavior.
   - For bug fixes, identify the failing logic path.
   - For new features, identify where the new logic should reside.

2. **The RED Phase: Specify the Change**
   - Add a new test case (or update an existing one) that fails specifically due to the missing feature or the bug.
   - **Tip**: Use `it.only(...)` or `describe.only(...)` to focus processing on the specific change.
   - Run the test and confirm it fails for the expected reason:
     ```bash
     npm run test:unit -- <file-path>
     ```

3. **The GREEN Phase: Minimal Implementation**
   - Write the absolute minimum amount of code to make the failing test pass.
   - Follow the **Testing SOP** (from `generate-tests.md`):
     - Prioritize logical integrity over just hitting lines.
     - Mock external boundaries (DB, APIs) correctly.
   - Verify the test passes.

4. **Refactor & Quality Gate Check**
   - Clean up code and test structure (names, DRY, types).
   - **Quality Gate Verification**:
     - **Coverage**: Run with coverage and ensure **>= 90% Lines, >= 70% Branches, >= 80% Functions** for the modified logic:
       ```bash
       npm run test:unit -- <file-path> --coverage
       ```
     - **Complexity**: Run static analysis to ensure the new implementation satisfies the complexity limits (Cyclomatic <= 10):
       ```bash
       npm run lint:complexity
       ```
   - If complexity or coverage thresholds are not met, refactor according to the "Refactor for Seams & Complexity" philosophy.

5. **Regression & Safety Check**
   - Remove any `.only` tags.
   - **Global Regression Test**: Run ALL tests in the project to ensure no regressions:
      ```bash
      npm run test:unit
      ```
   - **Global Coverage Check** (Optional): To verify global thresholds are met:
        ```bash
        npm run test:unit -- --coverage
        ```
   - Verify resource cleanup (e.g., `URL.revokeObjectURL` via spies) and state reset.
   - Ensure the final state is consistent with **generate-tests.md**.
6. **Final Documentation**
   - Create/Update `walkthrough.md` with:
     - Verified feature behavior or bug fix confirmation.
     - Coverage status.
     - Build verification.

### Self-Healing Guidelines
- If a fix breaks an existing test, determine if the existing test was too brittle or if the fix introduces a regression.
- Never delete an existing test just to make the current implementation pass unless the requirement has fundamentally changed.