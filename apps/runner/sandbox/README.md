# Python Sandbox Image

This directory contains the Dockerfile for the secure Python execution sandbox.

## Security Features

- **Non-root user**: Code runs as user `sandbox` (UID 1000), not root
- **Alpine base**: Minimal attack surface with small image size
- **Multi-stage build**: Build dependencies not included in final image
- **No network**: Containers run with `--network=none`
- **Read-only filesystem**: Root filesystem is read-only, only /tmp is writable
- **Resource limits**: CPU, memory, and PID limits enforced

## Building the Image

### Local Build
```bash
docker build -t python-sandbox:latest .
```

### Production Build (with CI/CD)
The image is automatically built and pushed to GitHub Container Registry when changes are made to this directory.

Image location: `ghcr.io/<your-org>/python-sandbox:latest`

## Testing the Image

```bash
# Run interactive Python shell
docker run -it --rm python-sandbox:latest

# Execute a Python script
docker run --rm python-sandbox:latest python -c "print('Hello from sandbox')"

# Test with security constraints (like production)
docker run --rm \
  --network=none \
  --memory=128m \
  --cpus=0.5 \
  --pids-limit=50 \
  --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=50m \
  --cap-drop=ALL \
  --security-opt=no-new-privileges \
  python-sandbox:latest python -c "print('Secured execution')"
```

## Adding Python Packages

To add packages needed by students:

1. Edit `requirements.txt`
2. Add package names (e.g., `numpy==1.24.0`)
3. Rebuild the image
4. Update runner to pull new image

## Image Size

Current size: ~50MB (Alpine + Python 3.11 + minimal packages)

## Security Considerations

- Never run with `--privileged`
- Always use `--network=none` in production
- Keep packages minimal and up-to-date
- Scan image for vulnerabilities regularly
- Use specific version tags, not `latest` in production
