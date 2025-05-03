FROM python:3.9

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install torch --index-url https://download.pytorch.org/whl/cpu
RUN pip install pandas numpy scikit-learn matplotlib torch-scatter torch-sparse torch-geometric ortools visualise

# Copy the rest of the application
COPY . .

# Set environment variables
ENV PYTHONPATH=/app

# Command to run the application
CMD ["python", "execution.py"] 