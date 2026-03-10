# Deploying to Render (Static Site)

The app is built as a **static export**. Next.js writes output to the **`out`** folder.

## Render Static Site settings

1. **Root Directory:** `frontend`
2. **Build Command:** `npm install && npm run build`
3. **Publish Directory:** `out`

Render will run the build from `frontend/`; the build produces `frontend/out/`. Because Root Directory is `frontend`, the Publish Directory is relative to that, so set it to **`out`** (not `frontend/out`).

## Build output

- `next build` with `output: 'export'` in `frontend/next.config.mjs` generates static files in `frontend/out/`.
- That folder is what Render serves as your Static Site.
