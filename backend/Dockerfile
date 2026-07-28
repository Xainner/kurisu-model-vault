FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app/ ./app/
RUN echo '#!/bin/bash\nif [ "$1" = "cli" ]; then shift; exec python -m app.cli "$@"\nelse\n  exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}\nfi' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh
EXPOSE 8000
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["server"]
