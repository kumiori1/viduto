#!/bin/bash

# Video AI Backend Startup Script

set -e

echo "🚀 Starting Video AI Backend..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "📝 Please update .env with your actual API keys and settings"
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Check required environment variables
required_vars=("FAL_API_KEY" "OPENAI_API_KEY" "BASE44_CALLBACK_URL")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Missing required environment variables:"
    printf '%s\n' "${missing_vars[@]}"
    echo "Please update your .env file with these values"
    exit 1
fi

echo "✅ Environment variables loaded"

# Build and start services
echo "🐳 Building Docker containers..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services started successfully!"
    echo ""
    echo "🌐 API Documentation: http://localhost:8000/docs"
    echo "📊 Celery Monitor: http://localhost:5555"
    echo "🔍 Health Check: http://localhost:8000/health"
    echo ""
    echo "📋 Service Status:"
    docker-compose ps
    echo ""
    echo "📝 To view logs:"
    echo "   docker-compose logs -f api"
    echo "   docker-compose logs -f celery-worker"
    echo ""
    echo "🛑 To stop services:"
    echo "   docker-compose down"
else
    echo "❌ Failed to start services. Check logs:"
    docker-compose logs
    exit 1
fi
