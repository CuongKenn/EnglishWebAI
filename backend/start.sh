#!/bin/sh

echo "Starting EnglishWebAI Backend..."

# Create .env from example if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "WARNING: Using default .env file. Please configure SMTP credentials!"
fi

# Function to check if database is ready
check_database() {
    python -c "from app.core.database import engine; engine.connect()" 2>/dev/null
}

# Wait for database to be ready (if using external DB)
echo "Waiting for database..."
until check_database; do
    echo "Database is unavailable - sleeping"
    sleep 2
done
echo "Database is ready!"

# Run database migrations
echo "Running database migrations..."
alembic upgrade head || echo "Migration failed, but continuing..."

# Clean up invalid temporary users
echo "Cleaning up temporary users..."
python fix_roles.py || echo "Cleanup script not found or failed, continuing..."

# Start the application
echo "Starting server..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload
