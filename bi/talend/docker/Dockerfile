FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY etl_load_dw.py ./

CMD ["python", "etl_load_dw.py"]
