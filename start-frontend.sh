#!/bin/bash

# Inventory System Frontend Startup Script
# This script starts the frontend services and runs the inventory system

set -e

echo "🚀 Starting Inventory System Frontend..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if .env file exists, create from example if not
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp env.example .env
    echo "✅ .env file created. Please review and update configuration if needed."
fi

# Build and start the services
echo "🔨 Building and starting services..."

# Start core services (database, redis, backend)
echo "📊 Starting core services..."
docker-compose up -d postgres redis backend

# Wait for backend to be healthy
echo "⏳ Waiting for backend to be ready..."
until docker-compose exec -T backend curl -f http://localhost:3000/api/health > /dev/null 2>&1; do
    echo "   Waiting for backend..."
    sleep 5
done
echo "✅ Backend is ready!"

# Start warehouse service
echo "🏭 Starting warehouse service..."
docker-compose up -d warehouse

# Wait for warehouse to be healthy
echo "⏳ Waiting for warehouse to be ready..."
until docker-compose exec -T warehouse curl -f http://localhost:3002/health > /dev/null 2>&1; do
    echo "   Waiting for warehouse..."
    sleep 5
done
echo "✅ Warehouse is ready!"

# Start frontend services
echo "🌐 Starting frontend services..."
docker-compose up -d frontend nginx

# Wait for frontend to be ready
echo "⏳ Waiting for frontend to be ready..."
until curl -f http://localhost:3000 > /dev/null 2>&1; do
    echo "   Waiting for frontend..."
    sleep 5
done
echo "✅ Frontend is ready!"

# Start React Native development server (optional)
read -p "🤔 Do you want to start the React Native development server? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📱 Starting React Native development server..."
    docker-compose up -d react-native
    
    echo "⏳ Waiting for React Native server to be ready..."
    until curl -f http://localhost:8081 > /dev/null 2>&1; do
        echo "   Waiting for React Native server..."
        sleep 5
    done
    echo "✅ React Native server is ready!"
    echo "📱 React Native server running on: http://localhost:8081"
fi

# Start monitoring services (optional)
read -p "🤔 Do you want to start monitoring services (Prometheus/Grafana)? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📊 Starting monitoring services..."
    docker-compose --profile monitoring up -d monitoring grafana
    
    echo "⏳ Waiting for monitoring services to be ready..."
    until curl -f http://localhost:9090 > /dev/null 2>&1; do
        echo "   Waiting for Prometheus..."
        sleep 5
    done
    until curl -f http://localhost:3003 > /dev/null 2>&1; do
        echo "   Waiting for Grafana..."
        sleep 5
    done
    echo "✅ Monitoring services are ready!"
    echo "📊 Prometheus: http://localhost:9090"
    echo "📈 Grafana: http://localhost:3003 (admin/admin)"
fi

# Display service status
echo ""
echo "🎉 Inventory System is running!"
echo ""
echo "📋 Service URLs:"
echo "   🌐 Frontend: http://localhost:3000"
echo "   🔧 Backend API: http://localhost:3001/api"
echo "   🏭 Warehouse: http://localhost:3002"
echo "   💾 Database: localhost:5432"
echo "   🔴 Redis: localhost:6379"
echo ""

if docker-compose ps | grep -q "react-native"; then
    echo "📱 React Native: http://localhost:8081"
fi

if docker-compose ps | grep -q "monitoring"; then
    echo "📊 Prometheus: http://localhost:9090"
    echo "📈 Grafana: http://localhost:3003"
fi

echo ""
echo "🔧 Useful Commands:"
echo "   View logs: docker-compose logs -f [service_name]"
echo "   Stop services: docker-compose down"
echo "   Restart services: docker-compose restart"
echo "   View status: docker-compose ps"
echo ""

# Open frontend in browser
read -p "🤔 Do you want to open the frontend in your browser? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v open > /dev/null 2>&1; then
        open http://localhost:3000
    elif command -v xdg-open > /dev/null 2>&1; then
        xdg-open http://localhost:3000
    else
        echo "🌐 Please open http://localhost:3000 in your browser"
    fi
fi

echo ""
echo "🎯 Ready to use the Inventory System!" 