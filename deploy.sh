#!/bin/bash

# =====================================================
# AI English Studio - One-Click Deployment Script
# =====================================================
# Usage: ./deploy.sh [command]
# Commands:
#   install   - First time installation
#   start     - Start all services
#   stop      - Stop all services
#   restart   - Restart all services
#   logs      - View logs
#   status    - Check service status
#   reset     - Reset database (WARNING: deletes all data)
# =====================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Print banner
print_banner() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════╗"
    echo "║       AI English Studio - Deployment           ║"
    echo "║       AI 英语口语学习平台                       ║"
    echo "╚════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Print status message
info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose."
        exit 1
    fi

    success "Docker is installed"
}

# Check if .env file exists
check_env() {
    if [ ! -f ".env" ]; then
        warn ".env file not found. Creating from template..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
            info "Please edit .env file with your configuration"
            info "Then run this script again"
            exit 0
        else
            error ".env.example not found"
            exit 1
        fi
    fi
    success ".env file found"
}

# Generate secure secrets
generate_secrets() {
    info "Generating secure secrets..."

    # Generate JWT secret
    JWT_SECRET=$(openssl rand -base64 32 | tr -d '\n')

    # Generate Postgres password
    POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d '\n' | tr -d '/')

    # Update .env file
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
        sed -i '' "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|" .env
    else
        sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
        sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|" .env
    fi

    success "Secrets generated and saved to .env"
}

# Create required directories
create_directories() {
    info "Creating data directories..."
    mkdir -p volumes/db/data
    mkdir -p volumes/storage
    success "Directories created"
}

# Build and start services
start_services() {
    info "Starting services..."

    if docker compose version &> /dev/null; then
        docker compose up -d --build
    else
        docker-compose up -d --build
    fi

    success "Services started"
}

# Stop services
stop_services() {
    info "Stopping services..."

    if docker compose version &> /dev/null; then
        docker compose down
    else
        docker-compose down
    fi

    success "Services stopped"
}

# Check service status
check_status() {
    info "Checking service status..."

    if docker compose version &> /dev/null; then
        docker compose ps
    else
        docker-compose ps
    fi
}

# View logs
view_logs() {
    if docker compose version &> /dev/null; then
        docker compose logs -f --tail=100
    else
        docker-compose logs -f --tail=100
    fi
}

# Wait for database to be ready
wait_for_db() {
    info "Waiting for database to be ready..."
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if docker compose exec -T db pg_isready -U postgres &> /dev/null; then
            success "Database is ready"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done

    error "Database failed to start"
    return 1
}

# Reset database
reset_database() {
    warn "This will DELETE ALL DATA. Are you sure? (type 'yes' to confirm)"
    read -r confirmation

    if [ "$confirmation" != "yes" ]; then
        info "Reset cancelled"
        exit 0
    fi

    info "Stopping services..."
    stop_services

    info "Removing database volume..."
    rm -rf volumes/db/data

    info "Recreating database..."
    create_directories
    start_services

    success "Database reset complete"
}

# Install function
install() {
    print_banner

    info "Starting installation..."

    check_docker
    check_env

    # Ask to generate secrets
    echo ""
    read -p "Generate new secure secrets? (recommended for production) [y/N]: " gen_secrets
    if [[ "$gen_secrets" =~ ^[Yy]$ ]]; then
        generate_secrets
    fi

    create_directories

    info "Building and starting services (this may take a few minutes)..."
    start_services

    info "Waiting for services to be ready..."
    sleep 10

    echo ""
    success "Installation complete!"
    echo ""
    echo -e "${GREEN}Access your application:${NC}"
    echo -e "  Frontend:  ${BLUE}http://localhost:3000${NC}"
    echo -e "  API:       ${BLUE}http://localhost:8000${NC}"
    echo ""
    echo -e "${YELLOW}Default admin account:${NC}"
    echo -e "  Phone: 13717753455"
    echo -e "  Password: 13717753455"
    echo ""
    echo -e "View logs: ${BLUE}./deploy.sh logs${NC}"
    echo -e "Stop:      ${BLUE}./deploy.sh stop${NC}"
    echo ""
}

# Main command handler
case "${1:-install}" in
    install)
        install
        ;;
    start)
        print_banner
        check_docker
        start_services
        ;;
    stop)
        print_banner
        stop_services
        ;;
    restart)
        print_banner
        stop_services
        start_services
        ;;
    logs)
        view_logs
        ;;
    status)
        print_banner
        check_status
        ;;
    reset)
        print_banner
        reset_database
        ;;
    *)
        echo "Usage: $0 {install|start|stop|restart|logs|status|reset}"
        exit 1
        ;;
esac
