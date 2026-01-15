---
description: Analyze uncommitted changes, verify E2E coverage, and plan new tests before implementation.
---

1. **Analyze Uncommitted Changes**
   - Run `git status` to see modified files.
   - Run `git diff` to view the actual code changes.
   - Analyze the changes to determine the intent: what specific bugs are fixed or features are added?

2. **Analyze E2E Coverage**
   - Search for existing E2E tests in `tests/e2e/specs/`.
   - Read relevant test files to check if the changes from Step 1 are covered.
   - Determine if there are missing test cases for the new changes.

3. **Draft Test Plan**
   - If missing test cases are identified, create a file named `E2E_DESIGN.md` in the current directory.
   - The file should contain:
     - **Feature/Fix Context**: Brief summary of the changes.
     - **Missing Coverage**: What scenarios are not tested.
     - **Proposed Test Cases**: For each new test case, list the detailed steps and expected assertions.

4. **Review with User**
   - If no new tests are needed, inform the user that coverage is sufficient and stop.
   - If `E2E_DESIGN.md` was created, use `notify_user` to ask the user to review the design document.
   - **WAIT** for the user to confirm/approve the design.

5. **Execute E2E Workflow**
   - Once the user approves the design:
   - Use `view_file` to read `.agent/workflows/e2e.md`.
   - Execute the steps defined in the `/e2e` workflow to implement and run the designed tests.
