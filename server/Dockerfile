# Serveur IA Crépuscule Studio — image GPU (NVIDIA). Pour une image légère sans IA : n'installez que requirements.txt.
FROM pytorch/pytorch:2.5.1-cuda12.4-cudnn9-runtime
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg git && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt requirements-ai.txt ./
RUN pip install --no-cache-dir -r requirements.txt && pip install --no-cache-dir -r requirements-ai.txt
COPY app.py .
ENV HF_HOME=/models CREPUSCULE_CACHE=/models/crepuscule LOW_VRAM=1
EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
