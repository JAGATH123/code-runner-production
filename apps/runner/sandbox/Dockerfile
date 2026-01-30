# =============================================================================
# Python Sandbox Dockerfile
# =============================================================================
# Multi-stage build for minimal, secure Python execution environment
# This sandbox is used to execute untrusted user code safely

# -----------------------------------------------------------------------------
# Stage 1: Builder - Install dependencies
# -----------------------------------------------------------------------------
FROM python:3.11-alpine AS builder

WORKDIR /build

# Install build dependencies
RUN apk add --no-cache gcc musl-dev

# Copy requirements and install Python packages (if any)
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt || true && \
    mkdir -p /root/.local/lib /root/.local/bin

# -----------------------------------------------------------------------------
# Stage 2: Runtime - Minimal secure environment
# -----------------------------------------------------------------------------
FROM python:3.11-alpine AS runtime

# Security: Create non-root user for code execution
RUN addgroup -g 1000 sandbox && \
    adduser -D -u 1000 -G sandbox sandbox

# Copy Python packages from builder stage
COPY --from=builder /root/.local /home/sandbox/.local
ENV PATH=/home/sandbox/.local/bin:$PATH

# Set working directory
WORKDIR /sandbox

# Security: Switch to non-root user
USER sandbox

# Python optimizations
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONHASHSEED=random

# Health check to verify Python interpreter
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "print('ok')" || exit 1

# Default command (overridden when container is used)
CMD ["python"]
