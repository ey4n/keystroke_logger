import os
import pickle
from functools import lru_cache
from typing import Dict, Literal

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ModelName = Literal["baseline", "change_only"]

DEFAULT_BASELINE_MODEL_PATH = "/Users/paramsrini/Downloads/stress_model_baseline.pkl"
DEFAULT_CHANGE_ONLY_MODEL_PATH = "/Users/paramsrini/Downloads/stress_model_change_only.pkl"


class PredictRequest(BaseModel):
    session_id: str
    test_type: Literal["timed", "multitasking"]
    preferred_model: ModelName
    features: Dict[str, float] = Field(default_factory=dict)


class PredictResponse(BaseModel):
    preferred_model: ModelName
    probability: float
    label: Literal["stressed", "not_stressed"]


app = FastAPI(title="Stress Model API", version="1.0.0")

# Allow browser calls from Next.js dev server (avoids opaque "Failed to fetch" when testing direct URL).
_cors = os.getenv(
    "STRESS_MODEL_CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _cors.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _load_pickle(path: str):
    with open(path, "rb") as f:
        return pickle.load(f)


@lru_cache(maxsize=2)
def get_model_artifacts(model_name: ModelName):
    if model_name == "baseline":
        path = os.getenv("STRESS_BASELINE_MODEL_PATH", DEFAULT_BASELINE_MODEL_PATH)
    else:
        path = os.getenv("STRESS_CHANGE_ONLY_MODEL_PATH", DEFAULT_CHANGE_ONLY_MODEL_PATH)

    if not os.path.exists(path):
        raise FileNotFoundError(f"Model file not found: {path}")

    artifacts = _load_pickle(path)
    for required_key in ("classifier", "scaler", "feature_names"):
        if required_key not in artifacts:
            raise ValueError(f"Invalid model artifact, missing key: {required_key}")
    return artifacts


def _ordered_vector(features: Dict[str, float], feature_names):
    return np.array([[float(features.get(name, 0.0)) for name in feature_names]], dtype=float)


@app.get("/health")
def health():
    try:
        baseline = get_model_artifacts("baseline")
        change_only = get_model_artifacts("change_only")
        return {
            "status": "ok",
            "baseline_features": len(baseline["feature_names"]),
            "change_only_features": len(change_only["feature_names"]),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Health check failed: {exc}") from exc


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    try:
        artifacts = get_model_artifacts(req.preferred_model)
        classifier = artifacts["classifier"]
        scaler = artifacts["scaler"]
        feature_names = artifacts["feature_names"]

        vector = _ordered_vector(req.features, feature_names)
        scaled = scaler.transform(vector)
        probability = float(classifier.predict_proba(scaled)[0][1])
        label: Literal["stressed", "not_stressed"] = (
            "stressed" if probability >= 0.5 else "not_stressed"
        )
        return PredictResponse(
            preferred_model=req.preferred_model,
            probability=probability,
            label=label,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc
