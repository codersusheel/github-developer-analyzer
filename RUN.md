# GitHub Developer Analyzer — Run Guide

## 1. Requirements

Install:

* Node.js 18+
* npm
* Git
* GitHub Personal Access Token

---

## 2. Install Project

```bash
git clone https://github.com/codersusheel/github-developer-analyzer.git

cd github-developer-analyzer

npm install
```

---

## 3. Configure `.env`

Project root mein `.env` file banao:

```env
NODE_ENV=development

PORT=3000
HOST=0.0.0.0

GITHUB_TOKEN=github_pat_YOUR_TOKEN_HERE

GITHUB_API_VERSION=2022-11-28

CACHE_ENABLED=true
CACHE_TTL=600000
CACHE_MAX_ENTRIES=100

RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

> **Important:** `.env` ko GitHub par commit mat karo.

---

## 4. Start Server

Development:

```bash
npm run dev
```

Normal:

```bash
npm start
```

Server:

```text
http://localhost:3000
```

---

## 5. Health Check

Browser mein:

```text
http://localhost:3000/api/health
```

Expected:

```json
{
  "success": true,
  "service": "GitHub Developer Analyzer"
}
```

---

## 6. Analyze Developer

Example:

```text
http://localhost:3000/api/github/analyze/codersusheel
```

System:

```text
GitHub Profile
      ↓
Repositories
      ↓
Repository Metadata
      ↓
Commits
      ↓
Issues
      ↓
Pull Requests
      ↓
Contributors
      ↓
README
      ↓
Evidence Analysis
      ↓
Developer Rating
```

---

## 7. Repository Analysis

Single repository:

```text
/api/github/repository/:owner/:repo
```

Example:

```text
/api/github/repository/codersusheel/github-developer-analyzer
```

Languages:

```text
/api/github/repository/:owner/:repo/languages
```

Commits:

```text
/api/github/repository/:owner/:repo/commits
```

Issues:

```text
/api/github/repository/:owner/:repo/issues
```

Pull Requests:

```text
/api/github/repository/:owner/:repo/pulls
```

Contributors:

```text
/api/github/repository/:owner/:repo/contributors
```

README:

```text
/api/github/repository/:owner/:repo/readme
```

Complete repository analysis:

```text
/api/github/repository/:owner/:repo/analyze
```

---

## 8. Frontend

Frontend files:

```text
index.html
style.css

assets/
└── js/
    ├── github-api.js
    ├── analyzer.js
    ├── analysis.js
    ├── repository.js
    ├── ui.js
    └── app.js
```

`github-api.js` frontend se backend API ko call karega.

Frontend mein GitHub token use nahi karna hai.

---

## 9. Cache

System server-side cache use karta hai.

```text
First Request
     ↓
Cache MISS
     ↓
GitHub API
     ↓
Analysis
     ↓
Cache SAVE
```

Next request:

```text
Request
  ↓
Cache HIT
  ↓
Fast Response
```

Default cache:

```text
TTL: 10 minutes
Maximum entries: 100
```

---

## 10. GitHub Rate Limit

Agar GitHub API rate limit error aaye:

```text
GitHub API rate limit reached
```

Check:

1. `.env` mein `GITHUB_TOKEN` set hai ya nahi.
2. Token valid hai ya nahi.
3. Server restart karo.
4. Same profile ko repeatedly request na karo.
5. Cache enabled rakho.

```env
CACHE_ENABLED=true
```

---

## 11. Evidence Policy

Analyzer ka core rule:

```text
Evidence Available
        ↓
     Analyze
        ↓
      Score
```

Agar evidence available nahi hai:

```text
Not Verifiable
```

System sirf:

* Stars
* Followers
* Repository count

ke basis par developer ko judge nahi karega.

---

## 12. Developer Rating

Final report example:

```text
Overall Rating: 86/100

Developer Level: Advanced

Coding Skill:        8.7/10
Code Quality:        8.5/10
Complexity:          8.8/10
Development Effort:  8.4/10
Originality:         8.2/10
Problem Solving:     8.6/10
Git/GitHub:          8.0/10
Documentation:       7.4/10
Security:            Not Verifiable
```

---

## 13. Development Flow

```text
index.html
     ↓
app.js
     ↓
github-api.js
     ↓
server.js
     ↓
routes.js
     ↓
cache.js
     ↓
github.js
     ↓
repository.js
     ↓
analysis.js
     ↓
analyzer.js
     ↓
Final Report
```

---

## 14. Production

Production environment:

```env
NODE_ENV=production

PORT=3000

GITHUB_TOKEN=YOUR_GITHUB_TOKEN

CACHE_ENABLED=true

RATE_LIMIT_ENABLED=true
```

Start:

```bash
npm start
```

---

## 15. Security Checklist

Before deployment:

```text
[ ] .env is in .gitignore
[ ] GitHub token is server-side only
[ ] API rate limiting enabled
[ ] Request timeout enabled
[ ] Input validation enabled
[ ] Cache enabled
[ ] Error messages don't expose secrets
[ ] GitHub token is never sent to frontend
```

---

## 16. Quick Start

```bash
git clone https://github.com/codersusheel/github-developer-analyzer.git

cd github-developer-analyzer

npm install

# Create .env and add GITHUB_TOKEN

npm start
```

Then open:

```text
http://localhost:3000
```

### Core Principle

> **GitHub data → Evidence → Analysis → Rating**

**No evidence = Not Verifiable.**
