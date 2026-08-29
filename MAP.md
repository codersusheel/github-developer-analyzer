# GitHub Developer Analyzer — File Map

```text
github-developer-analyzer/
│
├── index.html
├── README.md
├── MAP.md
├── package.json
├── .env
├── .gitignore
│
├── assets/
│   ├── css/
│   │   └── style.css
│   │
│   └── js/
│       ├── app.js
│       ├── github.js
│       ├── analysis.js
│       ├── repository.js
│       └── ui.js
│
├── server/
│   ├── server.js
│   ├── routes.js
│   ├── github-api.js
│   ├── analyzer.js
│   └── cache.js
│
└── config/
    └── config.js
```

## File Purpose

| File           | Purpose                    |
| -------------- | -------------------------- |
| `index.html`   | Main application UI        |
| `README.md`    | Project documentation      |
| `MAP.md`       | Project/file structure map |
| `package.json` | Dependencies & scripts     |
| `.env`         | Server-side secrets/config |
| `.gitignore`   | Ignored files              |

### Frontend

| File            | Purpose                    |
| --------------- | -------------------------- |
| `style.css`     | Complete UI styling        |
| `app.js`        | Application initialization |
| `github.js`     | Backend API requests       |
| `analysis.js`   | Developer analysis logic   |
| `repository.js` | Repository data & analysis |
| `ui.js`         | Render/update interface    |

### Backend

| File            | Purpose                     |
| --------------- | --------------------------- |
| `server.js`     | Backend server              |
| `routes.js`     | API endpoints               |
| `github-api.js` | GitHub API communication    |
| `analyzer.js`   | Evidence & scoring engine   |
| `cache.js`      | GitHub API response caching |

### Config

| File        | Purpose                   |
| ----------- | ------------------------- |
| `config.js` | Application configuration |

```
```
