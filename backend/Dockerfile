FROM python:3.9

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install torch --index-url https://download.pytorch.org/whl/cpu
RUN pip install torch-scatter torch-sparse torch-geometric ortools
RUN pip install pandas numpy scikit-learn matplotlib networkx seaborn openpyxl
RUN pip install python-utils

COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Set environment variables
ENV PYTHONPATH=/app

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"] 