# Model Overview

This document describes the stress model service in the `analysis/` folder.

## Purpose

The model component is a FastAPI service that loads trained stress-classification models from pickle files and exposes endpoints for health checks and live predictions.

## Main Responsibilities

- Load trained model artifacts from `analysis/models/`
- Validate that each artifact contains the expected objects
- Accept feature payloads from the frontend
- Transform feature vectors with the saved scaler
- Produce stress probabilities and labels
- Support deployment as a standalone prediction service

## Main Files

Core API:

- `analysis/stress_model_api.py`

Supporting analysis:

- `analysis/keystroke_stress_analysis.py`
- `analysis/README_analysis.md`

Deployment files:

- `analysis/Dockerfile`
- `analysis/DEPLOY_MODEL_RENDER.txt`
- `analysis/model_api_requirements.txt`

Model artifacts:

- `analysis/models/stress_model_baseline.pkl`
- `analysis/models/stress_model_change_only.pkl`

## Supported Models

The API supports two named models:

- `baseline`
- `change_only`

The requested model is selected with the `preferred_model` field in the prediction request.

## API Endpoints

### `GET /health`

Used to verify that:

- the service is running
- both pickled models can be loaded
- feature metadata is available

Typical response:

```json
{
  "status": "ok",
  "baseline_features": 24,
  "change_only_features": 12
}
```

### `POST /predict`

Accepts:

- `session_id`
- `test_type`
- `preferred_model`
- `features`

Example request:

```json
{
  "session_id": "example-session",
  "test_type": "timed",
  "preferred_model": "baseline",
  "features": {
    "typing_speed_baseline": 120.5,
    "typing_speed_change": 12.4
  }
}
```

Example response:

```json
{
  "preferred_model": "baseline",
  "probability": 0.73,
  "label": "stressed"
}
```

## Model Loading Behavior

Inside `analysis/stress_model_api.py`, the service:

- resolves the default model paths under `analysis/models/`
- optionally overrides those paths with environment variables
- caches loaded artifacts with `lru_cache`
- requires each pickle to contain:
  - `classifier`
  - `scaler`
  - `feature_names`

The incoming `features` object is converted into an ordered vector using the saved `feature_names`, with missing values defaulting to `0.0`.

## Relationship to the Frontend

The frontend computes typing metrics and sends prediction requests for:

- `timed`
- `multitasking`

The frontend can call the model service in two ways:

- through the Next.js proxy route `/api/stress-predict`
- directly via `NEXT_PUBLIC_STRESS_MODEL_API_URL`

If the browser calls the model service directly, CORS must allow the frontend origin.

## Environment Variables

Common environment variables:

- `STRESS_BASELINE_MODEL_PATH`
- `STRESS_CHANGE_ONLY_MODEL_PATH`
- `STRESS_MODEL_CORS_ORIGINS`

These allow custom model paths and configurable CORS origins across local or deployed environments.

## Running the Model API Locally

```bash
cd analysis
pip install -r model_api_requirements.txt
uvicorn stress_model_api:app --reload --port 8000
```

Default local API URL:

- `http://127.0.0.1:8000`

Health check:

- `http://127.0.0.1:8000/health`

## Deployment Notes

The repo already includes deployment support for Render:

- `analysis/Dockerfile` packages the API and model files
- `analysis/DEPLOY_MODEL_RENDER.txt` explains the Render setup

Important deployment detail:

- the pickle files must exist in `analysis/models/` with the expected filenames before building or deploying

## Summary

The model component is the backend prediction service for the project. It serves trained stress models, validates their artifacts, exposes health and prediction endpoints, and powers the frontend's live stress classification flow.
