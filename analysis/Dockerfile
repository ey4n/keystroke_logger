# Stress model API for Render (or any Docker host).
# Place stress_model_baseline.pkl and stress_model_change_only.pkl in models/ before build.
FROM python:3.11-slim

WORKDIR /app

COPY model_api_requirements.txt .
RUN pip install --no-cache-dir -r model_api_requirements.txt

COPY stress_model_api.py .
COPY models ./models

ENV STRESS_BASELINE_MODEL_PATH=/app/models/stress_model_baseline.pkl
ENV STRESS_CHANGE_ONLY_MODEL_PATH=/app/models/stress_model_change_only.pkl

EXPOSE 8000

# Render sets PORT at runtime.
CMD ["sh", "-c", "exec uvicorn stress_model_api:app --host 0.0.0.0 --port ${PORT:-8000}"]
