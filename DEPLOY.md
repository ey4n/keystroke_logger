# Deploying to Render

The Next.js app is in the **`frontend/`** folder. Use these settings so the build and run work correctly.

## Fix: "Publish directory build does not exist!"

The build succeeds; Render is looking for a folder that Next.js doesn’t create.

1. **Root Directory**  
   Set to **`frontend`** so Render runs all commands from the Next.js app (and uses the right `package-lock.json`).

2. **Publish Directory**  
   **Leave empty** (or delete the value if it’s set to `build`).  
   This service is a **Node.js Web Service** that runs `next start`. A “Publish directory” is only for static sites. Next.js puts the build in `.next`, and the server serves it—you don’t publish a folder.

3. **Build command**  
   `npm install && npm run build`

4. **Start command**  
   `npm run start`

## Optional: Use the Blueprint

A `render.yaml` in the repo is set up with `rootDir: frontend` and no publish directory. You can create or update the service from the Render dashboard using “New > Blueprint” and connect this repo so these settings apply automatically.
