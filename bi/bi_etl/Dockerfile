FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY load_star_schema.py ./

CMD ["python", "load_star_schema.py"]
