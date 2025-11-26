# Multi-stage build for AI Agent Service
# Stage 1: Build dependencies
FROM python:3.11-slim AS builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Production image
FROM python:3.11-slim

WORKDIR /app

# Create non-root user
RUN groupadd -r python && useradd -r -g python python

# Copy Python dependencies from builder
COPY --from=builder /root/.local /home/python/.local

# Copy application code
COPY . .

# Create database directory with proper permissions
RUN mkdir -p /app/data && \
    chown -R python:python /app

# Switch to non-root user
USER python

# Make sure scripts in .local are usable
ENV PATH=/home/python/.local/bin:$PATH

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

# Start the application
CMD ["python", "-m", "uvicorn", "app.main_sqlite:app", "--host", "0.0.0.0", "--port", "8000"]

