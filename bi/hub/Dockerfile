FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py ./
COPY static ./static/

ENV DW_SCHEMA_SQL=/ddl/schema.sql
ENV DW_PATCH_SQL=/ddl/migrations/001_patch_etl_log_scd2.sql

EXPOSE 8080
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
