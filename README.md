# Keystroke Logger

This repository contains a keystroke-based stress research system with two main parts:

- a participant-facing frontend website built with Next.js
- a backend stress model API built with FastAPI

The frontend collects consent, runs typing tasks, captures keystroke dynamics, saves research data to Supabase, and requests stress predictions from the model service.

## Main Components

### Data Collection Website

The website lives in `frontend/` and handles:

- participant consent
- session management
- typing tests
- keystroke logging
- Supabase data saving
- prediction requests to the model API

Detailed doc:

- [DATA_COLLECTION.md](./DATA_COLLECTION.md)

### Stress Model API

The model service lives in `analysis/` and handles:

- loading trained pickle models
- health checks
- feature-based stress prediction
- local or deployed API serving

Detailed doc:

- [MODEL_OVERVIEW.md](./MODEL_OVERVIEW.md)

## Repo Structure

```text
keystroke_logger/
├── frontend/                  # Next.js website
├── analysis/                  # Python model API and analysis code
├── DATA_COLLECTION.md       # Frontend documentation
├── MODEL_OVERVIEW.md          # Model documentation
├── DEPLOY.md
└── render.yaml
```

## Quick Start

### Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

- `http://localhost:3000`

### Run the Model API

```bash
cd analysis
pip install -r model_api_requirements.txt
uvicorn stress_model_api:app --reload --port 8000
```

Model API URL:

- `http://127.0.0.1:8000`

Health check:

- `http://127.0.0.1:8000/health`

## High-Level Flow

1. A participant opens the frontend website.
2. The app creates a session and collects consent.
3. The participant completes typing tasks.
4. Keystroke and survey-related data are saved to Supabase.
5. The frontend computes stress-related features.
6. The frontend sends a prediction request to the model API.
7. The model API returns stress probabilities and labels.

## Prediction Integration

The frontend uses:

- `frontend/src/app/api/stress-predict/route.ts`

This proxy forwards prediction requests to the model service and avoids browser CORS issues in the default setup.

Useful environment variables:

- `STRESS_MODEL_API_URL`
- `NEXT_PUBLIC_STRESS_MODEL_API_URL`
- `STRESS_MODEL_CORS_ORIGINS`

## Notes

- The trained model pickle files are expected in `analysis/models/`.
- The frontend prediction flow depends on a saved free-typing baseline for the same session.
- The repo includes deployment files for Render under `render.yaml` and `analysis/Dockerfile`.

## Documentation

- [DATA_COLLECTION.md](./DATA_COLLECTION.md)
- [MODEL_OVERVIEW.md](./MODEL_OVERVIEW.md)
- [analysis/README_analysis.md](./analysis/README_analysis.md)
- [DEPLOY.md](./DEPLOY.md)
