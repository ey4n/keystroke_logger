import os
import pickle
from typing import Dict, List, Literal

import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


DEFAULT_BASELINE_MODEL = "/Users/paramsrini/Downloads/stress_model_baseline.pkl"
DEFAULT_CHANGE_ONLY_MODEL = "/Users/paramsrini/Downloads/stress_model_change_only.pkl"


class PredictRequest(BaseModel):
    test_type: Literal["timed", "multitasking"]
    metrics_change: Dict[str, float]
    metrics_baseline: Dict[str, float]
    preferred_model: Literal["auto", "baseline", "change_only"] = "auto"


class PredictResponse(BaseModel):
    label: Literal["stressed", "not_stressed"]
    probability_stressed: float = Field(ge=0.0, le=1.0)
    model_used: str
    model_approach: str
    model_auc: float


class ModelArtifacts:
    def __init__(self, path: str):
        with open(path, "rb") as f:
            data = pickle.load(f)
        self.classifier = data["classifier"]
        self.scaler = data["scaler"]
        self.feature_names = data["feature_names"]
        self.approach = data.get("approach", "unknown")
        self.best_auc = float(data.get("best_auc", 0.0))

    def predict(self, features: Dict[str, float]) -> Dict[str, float | str]:
        x = np.array([[float(features.get(name, 0.0)) for name in self.feature_names]])
        x_scaled = self.scaler.transform(x)
        proba = float(self.classifier.predict_proba(x_scaled)[0][1])
        label = "stressed" if proba >= 0.5 else "not_stressed"
        return {"label": label, "probability_stressed": proba}


def _build_feature_payload(change: Dict[str, float], baseline: Dict[str, float]) -> Dict[str, float]:
    payload: Dict[str, float] = {}
    for key, value in change.items():
        payload[f"{key}_change"] = float(value)
    for key, value in baseline.items():
        payload[f"{key}_baseline"] = float(value)
    return payload


baseline_model_path = os.getenv("STRESS_MODEL_BASELINE_PATH", DEFAULT_BASELINE_MODEL)
change_only_model_path = os.getenv("STRESS_MODEL_CHANGE_ONLY_PATH", DEFAULT_CHANGE_ONLY_MODEL)

BASELINE_MODEL = ModelArtifacts(baseline_model_path)
CHANGE_ONLY_MODEL = ModelArtifacts(change_only_model_path)

app = FastAPI(title="Stress Model Inference API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    features = _build_feature_payload(req.metrics_change, req.metrics_baseline)

    model_name = req.preferred_model
    if model_name == "auto":
        model_name = "change_only"

    if model_name == "baseline":
        out = BASELINE_MODEL.predict(features)
        return PredictResponse(
            label=out["label"],  # type: ignore[arg-type]
            probability_stressed=float(out["probability_stressed"]),
            model_used="stress_model_baseline.pkl",
            model_approach=BASELINE_MODEL.approach,
            model_auc=BASELINE_MODEL.best_auc,
        )

    out = CHANGE_ONLY_MODEL.predict(features)
    return PredictResponse(
        label=out["label"],  # type: ignore[arg-type]
        probability_stressed=float(out["probability_stressed"]),
        model_used="stress_model_change_only.pkl",
        model_approach=CHANGE_ONLY_MODEL.approach,
        model_auc=CHANGE_ONLY_MODEL.best_auc,
    )
