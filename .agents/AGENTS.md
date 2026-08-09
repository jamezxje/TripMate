# Agent Instructions & Project Rules (TripMate)

## Critical Workflow Rules (Mandatory)

1. **Git Branching:**
   - Every time the user requests a new feature or a bug fix, you MUST create and checkout a new Git branch first (`git checkout -b feature/<feature-name>` or `git checkout -b fix/<bug-name>`) before modifying any source code files.

2. **Self-Testing via `chrome-devtools-mcp`:**
   - After completing code modifications or feature implementation, you MUST use `chrome-devtools-mcp` tools to test and verify the web interface and functionality in the browser.
   - Verify that there are no unexpected JavaScript console errors or failed network requests before declaring completion.

3. **Project Architecture & Conventions:**
   - Always follow the detailed guidelines and conventions documented in [instruction.md](file:///g:/DuyTX/TripMate/instruction.md).
