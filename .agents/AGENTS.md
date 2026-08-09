# Agent Instructions & Project Rules (TripMate)

## Critical Workflow Rules (Mandatory)

1. **Git Branching:**
   - Every time the user requests a new feature or a bug fix, you MUST create and checkout a new Git branch first (`git checkout -b feature/<feature-name>` or `git checkout -b fix/<bug-name>`) before modifying any source code files.

2. **Self-Testing via `chrome-devtools-mcp`:**
   - After completing code modifications or feature implementation, you MUST use `chrome-devtools-mcp` tools to test and verify the web interface and functionality in the browser.
   - Verify that there are no unexpected JavaScript console errors or failed network requests before declaring completion.

3. **Project Architecture & Conventions:**
   - Always follow the detailed guidelines and conventions documented in [instruction.md](file:///g:/DuyTX/TripMate/instruction.md).

## Production Deployment Environment Information

- **Frontend (Web App):** [https://trip-mate-sand.vercel.app](https://trip-mate-sand.vercel.app) (Deployed on Vercel)
- **Backend (REST APIs):** `https://tripmate-backend-0rts.onrender.com` (Deployed on Render.com with Docker Container)
- **Database (Cloud MySQL):** Aiven.io MySQL 8.0 (`mysql-3dd3c20c-trxuanduy24tripmate.f.aivencloud.com:27267`, DB name: `defaultdb`)
- **Demo Accounts File:** Refer to [demo_accounts.json](file:///g:/DuyTX/TripMate/demo_accounts.json) for test credentials.

