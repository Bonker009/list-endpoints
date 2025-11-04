# Docker Setup

This project includes Docker configuration for easy deployment.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

## Quick Start

### Build and run with Docker Compose

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

### Build and run with Docker only

```bash
# Build the image
docker build -t list-endpoints-app .

# Run the container
docker run -p 3000:3000 -v $(pwd)/data:/app/data list-endpoints-app
```

## Accessing the Application

Once the container is running, access the application at:
- **URL**: http://localhost:3000

## Data Persistence

The `data` directory is mounted as a volume to persist:
- API specifications (`data/specs/`)
- Status files (`data/status/`)
- Settings files (`data/settings/`)

This ensures your data persists even when the container is stopped or removed.

## Environment Variables

You can customize the application by setting environment variables in `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=production
  - NEXT_TELEMETRY_DISABLED=1
  # Add your custom variables here
```

## Troubleshooting

### Container won't start
- Check logs: `docker-compose logs`
- Verify port 3000 is not in use: `lsof -i :3000` (macOS/Linux) or `netstat -ano | findstr :3000` (Windows)

### Build fails
- Ensure you have enough disk space
- Clear Docker cache: `docker system prune -a`
- Rebuild without cache: `docker-compose build --no-cache`

### Data not persisting
- Ensure the `data` directory exists and has proper permissions
- Check volume mount in `docker-compose.yml`

## Production Deployment

For production deployment:

1. Update environment variables in `docker-compose.yml`
2. Use a reverse proxy (nginx, Traefik) in front of the container
3. Set up proper SSL/TLS certificates
4. Configure logging and monitoring
5. Use Docker secrets for sensitive data

## Commands Reference

```bash
# Build image
docker-compose build

# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f web

# Restart services
docker-compose restart

# Execute command in container
docker-compose exec web sh

# Remove everything (including volumes)
docker-compose down -v
```

