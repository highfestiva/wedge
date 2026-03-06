# Wedge, yet another issue tracker

Wedge is simple and fast, and forever without bloat. It will never contain your pet feature or integration, but instead
just do the basics really well and without fuss.

## Running your own instance

```bash
docker compose up -d --build
```

| Service  | URL                    |
|----------|------------------------|
| Frontend | http://localhost:3000   |
| Backend  | http://localhost:8000   |
| MongoDB  | mongodb://localhost:27017 |

## Running tests

**Backend** (Python ≥ 3.12):
```bash
cd backend
python -m pip install -e ".[dev]"
pytest
```

**Frontend** (Node.js):
```bash
cd frontend
npm install
npm test
```

## Tech

- **Frontend** — TypeScript, React, Vite, Tailwind CSS, urql (GraphQL client).
- **Backend** — Python, Starlette, Strawberry (GraphQL), Motor (async MongoDB driver).
- **Database** — MongoDB.
