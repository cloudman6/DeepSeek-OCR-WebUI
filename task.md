# Initial Explanation Stage

Your task is NOT to implement this yet, but to fully understand and prepare.

Here is exactly what I need implemented:

```
增加如下测试用例：
准备工作：添加包含各种类型的多个文件，请使用 tests/e2e/fixtures 中的pdf/图片测试文件

验证page-list 的UI交互功能
1.page-item默认不显示删除按钮。只有当鼠标移某个page-item上，此page-item的删除按钮才显示，当鼠标移到删除按钮，按钮变红，移开恢复原来的颜色。鼠标移出改page-item，删除按钮消失
2.选中page-list 的 toolbar默认不显示删除按钮。当选中toolbar的checkbox，所有page-item的checkbox都被选中, 并且显示出toolbar的删除按钮。当鼠标移到删除按钮，按钮变红，移开恢复原来的颜色。反选toolbar checkbox, 所有page-item的checkbox都反选，并且toolbar的删除按钮消失
3.选中某个page-item的checkbox, page-list toolbar上显示出删除按钮。反选checkbox，删除按钮消失
4.可以通过拖拽移动page-list中的page-item


```

---

Your responsibilities:

- Analyze and understand the existing codebase thoroughly.
- Determine exactly how this feature integrates, including dependencies, structure, edge cases (within reason, don't go overboard), and constraints.
- Clearly identify anything unclear or ambiguous in my description or the current implementation.
- List clearly all questions or ambiguities you need clarified.

Remember, your job is not to implement (yet). Just exploring, planning, and then asking me questions to ensure all ambiguities are covered. We will go back and forth until you have no further questions. Do NOT assume any requirements or scope beyond explicitly described details.

---

Once you've answered all of questions and it has nothing more to ask, paste in this prompt:

---

# Plan Creation Stage

Based on our full exchange, now, produce a markdown plan document (`plan.md`).

Requirements for the plan:

- Include clear, minimal, concise steps.
- Track the status of each step using these emojis:
  - 🟩 Done
  - 🟨 In Progress
  - 🟥 To Do
- Include dynamic tracking of overall progress percentage (at top).
- Do NOT add extra scope or unnecessary complexity beyond explicitly clarified details.
- Steps should be modular, elegant, minimal, and integrate seamlessly within the existing codebase.

Markdown Template Example:

```plan.md (example)
# (Example) Feature Implementation Plan

**Overall Progress:** `0%`

## Tasks:

- [ ] 🟥 **Step 1: Setup authentication module**
  - [ ] 🟥 Create authentication service class
  - [ ] 🟥 Implement JWT token handling
  - [ ] 🟥 Connect service to existing database schema

- [ ] 🟥 **Step 2: Develop frontend login UI**
  - [ ] 🟥 Design login page component (React)
  - [ ] 🟥 Integrate component with auth endpoints
  - [ ] 🟥 Add form validation and error handling

- [ ] 🟥 **Step 3: Add user session management**
  - [ ] 🟥 Set up session cookies securely
  - [ ] 🟥 Implement session renewal logic
  - [ ] 🟥 Handle session expiry and logout process

...
```

Again, for clarity, it's still not time to build yet. Just write the clear plan document. No extra complexity or extra scope beyond what we discussed. The plan should lead to simple, elegant, minimal code that does the job perfectly.

---

Now, once this plan is done, look it over, and if it looks good, then prompt it with:

---

Now implement precisely as planned, in full.

Implementation Requirements:

- Write elegant, minimal, modular code.
- Adhere strictly to existing code patterns, conventions, and best practices.
- Include thorough, clear comments/documentation within the code.
- As you implement each step:
  - Update the markdown tracking document with emoji status and overall progress percentage dynamically.