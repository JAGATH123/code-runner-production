# =============================================================================
# Python Sandbox Dockerfile - Matplotlib + Pygame Support
# =============================================================================
# Using Debian slim for better compatibility

# -----------------------------------------------------------------------------
# Stage 1: Builder - Install Python packages with SDL for Pygame
# -----------------------------------------------------------------------------
FROM python:3.11-slim-bookworm AS builder

# Install minimal SDL libraries required for pygame (skip optional mixer/ttf/image)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsdl2-dev \
    && rm -rf /var/lib/apt/lists/* || true

WORKDIR /build

# Copy requirements and install Python packages
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# -----------------------------------------------------------------------------
# Stage 2: Runtime - Secure execution environment
# -----------------------------------------------------------------------------
FROM python:3.11-slim-bookworm AS runtime

# Install minimal SDL runtime library for pygame
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsdl2-2.0-0 \
    && rm -rf /var/lib/apt/lists/* || true

# Security: Create non-root user for code execution
RUN groupadd -g 1000 sandbox && \
    useradd -u 1000 -g sandbox -m -s /bin/bash sandbox

# Copy Python packages from builder stage
COPY --from=builder /root/.local /home/sandbox/.local

# Set ownership
RUN chown -R sandbox:sandbox /home/sandbox/.local

# Environment variables
ENV PATH=/home/sandbox/.local/bin:$PATH \
    # Python optimizations
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONHASHSEED=random \
    # Matplotlib headless backend and config directory
    MPLBACKEND=Agg \
    MPLCONFIGDIR=/tmp/matplotlib \
    # Pygame headless mode (if pygame is installed)
    SDL_VIDEODRIVER=dummy \
    SDL_AUDIODRIVER=dummy \
    PYGAME_HIDE_SUPPORT_PROMPT=1

# Set working directory
WORKDIR /tmp

# Security: Switch to non-root user
USER sandbox

# Health check to verify Python
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD python -c "import sys; print('ok')" || exit 1

# Keep container alive - CRITICAL for container pooling
CMD ["sh", "-c", "while true; do sleep 3600; done"]
