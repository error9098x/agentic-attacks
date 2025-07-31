#!/bin/bash

# MCP Injection Demo Cleanup Script
# Removes demo artifacts and stops demo services

set -e

echo "🧹 Starting MCP Injection Demo cleanup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[CLEANUP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to kill processes by name
kill_processes() {
    local process_name="$1"
    local pids=$(pgrep -f "$process_name" 2>/dev/null || true)
    
    if [ -n "$pids" ]; then
        print_status "Stopping $process_name processes..."
        echo "$pids" | xargs kill -TERM 2>/dev/null || true
        sleep 2
        
        # Force kill if still running
        pids=$(pgrep -f "$process_name" 2>/dev/null || true)
        if [ -n "$pids" ]; then
            print_warning "Force killing remaining $process_name processes..."
            echo "$pids" | xargs kill -KILL 2>/dev/null || true
        fi
        
        print_success "Stopped $process_name processes"
    else
        print_status "No $process_name processes found"
    fi
}

# Function to remove files and directories
remove_paths() {
    local paths=("$@")
    
    for path in "${paths[@]}"; do
        if [ -e "$path" ]; then
            if [ -d "$path" ]; then
                print_status "Removing directory: $path"
                rm -rf "$path"
                print_success "Removed directory: $path"
            else
                print_status "Removing file: $path"
                rm -f "$path"
                print_success "Removed file: $path"
            fi
        else
            print_status "Path does not exist: $path"
        fi
    done
}

# Function to clean up demo files
cleanup_demo_files() {
    print_status "Cleaning up demo files..."
    
    # Demo directories
    local demo_dirs=(
        "tmp/demo"
        "tmp/backup"
        "tmp/cache"
        "tmp/uploads"
        "logs"
    )
    
    # Demo files
    local demo_files=(
        "tmp/demo-server.js"
        ".env.demo"
        "DEMO_README.md"
        "tmp/demo/config.json"
        "tmp/demo/data.txt"
        "tmp/demo/backup.sql"
        "tmp/cache/session.json"
    )
    
    # Attack artifacts
    local attack_files=(
        "/tmp/owned"
        "/tmp/evil"
        "/tmp/user_info"
        "/tmp/identity"
        "/tmp/system_info"
        "/tmp/passwd_copy"
        "/tmp/processes"
        "/tmp/network"
        "/tmp/ping_test"
        "/tmp/external_ip"
        "/tmp/dns_test"
        "/tmp/route_test"
        "/tmp/data.tar.gz"
        "/tmp/text_files"
        "/tmp/passwords"
        "/tmp/kernel_info"
        "/tmp/cron_job"
        "/tmp/alias"
        "/tmp/path_mod"
        "/tmp/type_coercion_demo"
        "/tmp/demo_result"
        "/tmp/attack_timestamp"
        "/tmp/current_user"
        "/tmp/chain_owned"
        "/tmp/chain_user"
        "/tmp/chain_passwd"
        "/tmp/chain_processes"
        "/tmp/chain_network"
        "/tmp/chain_files"
        "/tmp/chain_passwords"
        "/tmp/chain_data.tar.gz"
        "/tmp/chain_ip"
        "/tmp/chain_ping"
        "/tmp/chain_dns"
        "/tmp/chain_destruction"
        "/tmp/chain_backdoor.sh"
        "/tmp/chain_cron"
        "/tmp/chain_alias"
        "/tmp/chain_path"
        "/tmp/chain_demo"
        "/tmp/chain_result"
        "/tmp/chain_timestamp"
        "/tmp/chain_user"
        "/tmp/back.sh"
        "/tmp/backdoor.sh"
        "/tmp/back.py"
        "/tmp/back.js"
        "/tmp/back.php"
        "/tmp/cron_backdoor"
        "/tmp/backdoor.service"
        "/tmp/.hidden_backdoor"
        "/tmp/backdoor.so"
        "/tmp/backdoor.ko"
        "/tmp/web_backdoor.php"
        "/tmp/cgi_backdoor.cgi"
        "/tmp/mod_backdoor.so"
        "/tmp/dns_backdoor.sh"
        "/tmp/icmp_backdoor.sh"
        "/tmp/http_backdoor.sh"
        "/tmp/suid_backdoor"
        "/tmp/sudo_backdoor"
        "/tmp/cap_backdoor"
        "/tmp/demo_backdoor.sh"
        "/tmp/info_backdoor.sh"
        "/tmp/file_backdoor.sh"
        "/tmp/enc_backdoor.sh"
        "/tmp/poly_backdoor.sh"
        "/tmp/stealth_backdoor.sh"
        "/tmp/type_coercion_test"
        "/tmp/backdoor_test.sh"
        "/tmp/info_gathering_test"
        "/tmp/network_recon_test"
        "/tmp/chain_test_dir"
        "/tmp/type_coercion_secure_test"
        "/tmp/backdoor_secure_test.sh"
        "/tmp/info_gathering_secure_test"
        "/tmp/chain_secure_test_dir"
        "/tmp/test*"
    )
    
    # Remove demo directories
    for dir in "${demo_dirs[@]}"; do
        remove_paths "$dir"
    done
    
    # Remove demo files
    for file in "${demo_files[@]}"; do
        remove_paths "$file"
    done
    
    # Remove attack artifacts
    for file in "${attack_files[@]}"; do
        remove_paths "$file"
    done
    
    print_success "Demo files cleanup completed"
}

# Function to stop demo services
stop_demo_services() {
    print_status "Stopping demo services..."
    
    # Stop demo server on port 8080
    if command_exists "lsof"; then
        local demo_server_pid=$(lsof -ti:8080 2>/dev/null || true)
        if [ -n "$demo_server_pid" ]; then
            print_status "Stopping demo server on port 8080..."
            kill -TERM "$demo_server_pid" 2>/dev/null || true
            sleep 2
            
            # Force kill if still running
            demo_server_pid=$(lsof -ti:8080 2>/dev/null || true)
            if [ -n "$demo_server_pid" ]; then
                print_warning "Force killing demo server..."
                kill -KILL "$demo_server_pid" 2>/dev/null || true
            fi
            
            print_success "Stopped demo server on port 8080"
        else
            print_status "No demo server found on port 8080"
        fi
    fi
    
    # Kill any remaining Node.js processes related to the demo
    kill_processes "node.*demo"
    kill_processes "node.*mcp"
    
    print_success "Demo services stopped"
}

# Function to clean up Node.js processes
cleanup_node_processes() {
    print_status "Cleaning up Node.js processes..."
    
    # Kill any Node.js processes that might be related to the demo
    local node_pids=$(pgrep -f "node.*server" 2>/dev/null || true)
    
    if [ -n "$node_pids" ]; then
        print_warning "Found Node.js server processes, stopping them..."
        echo "$node_pids" | xargs kill -TERM 2>/dev/null || true
        sleep 2
        
        # Force kill if still running
        node_pids=$(pgrep -f "node.*server" 2>/dev/null || true)
        if [ -n "$node_pids" ]; then
            print_warning "Force killing remaining Node.js processes..."
            echo "$node_pids" | xargs kill -KILL 2>/dev/null || true
        fi
    fi
    
    print_success "Node.js processes cleanup completed"
}

# Function to clean up temporary files
cleanup_temp_files() {
    print_status "Cleaning up temporary files..."
    
    # Remove any temporary files created during the demo
    local temp_patterns=(
        "/tmp/*demo*"
        "/tmp/*test*"
        "/tmp/*backdoor*"
        "/tmp/*attack*"
        "/tmp/*evil*"
        "/tmp/*owned*"
        "/tmp/*chain*"
        "/tmp/*coercion*"
    )
    
    for pattern in "${temp_patterns[@]}"; do
        if ls $pattern 1> /dev/null 2>&1; then
            print_status "Removing files matching pattern: $pattern"
            rm -f $pattern
        fi
    done
    
    print_success "Temporary files cleanup completed"
}

# Function to clean up log files
cleanup_log_files() {
    print_status "Cleaning up log files..."
    
    local log_files=(
        "logs/*.log"
        "*.log"
        "npm-debug.log*"
        "yarn-debug.log*"
        "yarn-error.log*"
    )
    
    for pattern in "${log_files[@]}"; do
        if ls $pattern 1> /dev/null 2>&1; then
            print_status "Removing log files matching pattern: $pattern"
            rm -f $pattern
        fi
    done
    
    print_success "Log files cleanup completed"
}

# Function to clean up environment files
cleanup_env_files() {
    print_status "Cleaning up environment files..."
    
    local env_files=(
        ".env.demo"
        ".env.local"
        ".env.backup"
    )
    
    for file in "${env_files[@]}"; do
        remove_paths "$file"
    done
    
    print_success "Environment files cleanup completed"
}

# Function to verify cleanup
verify_cleanup() {
    print_status "Verifying cleanup..."
    
    local checks=(
        "Demo directories"
        "Demo files"
        "Attack artifacts"
        "Demo services"
        "Node.js processes"
        "Temporary files"
        "Log files"
        "Environment files"
    )
    
    local failed_checks=()
    
    # Check for remaining demo directories
    if [ -d "tmp/demo" ] || [ -d "tmp/backup" ] || [ -d "tmp/cache" ]; then
        failed_checks+=("Demo directories")
    fi
    
    # Check for remaining demo files
    if [ -f "tmp/demo-server.js" ] || [ -f ".env.demo" ] || [ -f "DEMO_README.md" ]; then
        failed_checks+=("Demo files")
    fi
    
    # Check for remaining attack artifacts
    if ls /tmp/*demo* /tmp/*test* /tmp/*backdoor* /tmp/*attack* /tmp/*evil* /tmp/*owned* /tmp/*chain* /tmp/*coercion* 1> /dev/null 2>&1; then
        failed_checks+=("Attack artifacts")
    fi
    
    # Check for remaining demo services
    if lsof -ti:8080 >/dev/null 2>&1; then
        failed_checks+=("Demo services")
    fi
    
    # Check for remaining Node.js processes
    if pgrep -f "node.*demo" >/dev/null 2>&1 || pgrep -f "node.*mcp" >/dev/null 2>&1; then
        failed_checks+=("Node.js processes")
    fi
    
    # Check for remaining temporary files
    if ls /tmp/*demo* /tmp/*test* /tmp/*backdoor* /tmp/*attack* /tmp/*evil* /tmp/*owned* /tmp/*chain* /tmp/*coercion* 1> /dev/null 2>&1; then
        failed_checks+=("Temporary files")
    fi
    
    # Check for remaining log files
    if ls logs/*.log *.log npm-debug.log* yarn-debug.log* yarn-error.log* 1> /dev/null 2>&1; then
        failed_checks+=("Log files")
    fi
    
    # Check for remaining environment files
    if [ -f ".env.demo" ] || [ -f ".env.local" ] || [ -f ".env.backup" ]; then
        failed_checks+=("Environment files")
    fi
    
    if [ ${#failed_checks[@]} -eq 0 ]; then
        print_success "All cleanup checks passed!"
        return 0
    else
        print_warning "Some cleanup checks failed:"
        for check in "${failed_checks[@]}"; do
            print_warning "  - $check"
        done
        return 1
    fi
}

# Main cleanup function
main() {
    echo "🧹 MCP Injection Demo Cleanup"
    echo "=============================="
    
    # Stop demo services first
    stop_demo_services
    
    # Clean up Node.js processes
    cleanup_node_processes
    
    # Clean up demo files
    cleanup_demo_files
    
    # Clean up temporary files
    cleanup_temp_files
    
    # Clean up log files
    cleanup_log_files
    
    # Clean up environment files
    cleanup_env_files
    
    # Verify cleanup
    if verify_cleanup; then
        echo ""
        echo "✅ Cleanup completed successfully!"
        echo "All demo artifacts have been removed."
        echo "Demo services have been stopped."
        echo ""
        echo "You can now safely run the demo again with:"
        echo "  npm run seed"
    else
        echo ""
        print_warning "Cleanup completed with some issues."
        print_warning "Please check the warnings above and clean up manually if needed."
        exit 1
    fi
}

# Run main function
main "$@" 