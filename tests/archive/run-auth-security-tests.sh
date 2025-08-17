#!/bin/bash

# Comprehensive Authentication Security Test Runner
# This script runs all authentication security tests with detailed reporting

set -e  # Exit on any error

echo "🔐 Starting Comprehensive Authentication Security Testing..."
echo "================================================="

# Check if required tools are installed
command -v curl >/dev/null 2>&1 || { echo "curl is required but not installed. Aborting." >&2; exit 1; }
command -v jq >/dev/null 2>&1 || echo "Warning: jq not found. JSON output will be raw."

# Configuration
BACKEND_URL="http://localhost:5000"
FRONTEND_URL="http://localhost:3000"
API_BASE_URL="${BACKEND_URL}/api"
TEST_RESULTS_FILE="auth-security-test-results.json"
FAILED_TESTS=()

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    FAILED_TESTS+=("$1")
}

test_endpoint() {
    local method="$1"
    local url="$2"
    local data="$3"
    local expected_status="$4"
    local test_name="$5"
    
    local curl_opts="-s -w '%{http_code}' -o /tmp/response_body"
    
    if [ "$method" = "POST" ]; then
        curl_opts="$curl_opts -X POST -H 'Content-Type: application/json'"
        if [ -n "$data" ]; then
            curl_opts="$curl_opts -d '$data'"
        fi
    fi
    
    local response_code
    response_code=$(eval curl $curl_opts "$url")
    
    if [ "$response_code" -eq "$expected_status" ]; then
        log_success "$test_name"
        return 0
    else
        log_error "$test_name (Expected: $expected_status, Got: $response_code)"
        return 1
    fi
}

# Check if backend is running
echo "🔍 Pre-flight checks..."
if ! curl -s "$BACKEND_URL/api/health" > /dev/null; then
    log_error "Backend is not running at $BACKEND_URL"
    echo "Please start the backend server and try again."
    exit 1
fi
log_success "Backend is running"

# Check if frontend is running
if ! curl -s "$FRONTEND_URL" > /dev/null; then
    log_warning "Frontend is not running at $FRONTEND_URL (optional for API tests)"
else
    log_success "Frontend is running"
fi

echo ""
echo "🛡️ Starting API Security Tests..."
echo "=================================="

# Test 1: SQL Injection Prevention
echo "Testing SQL Injection Prevention..."
test_endpoint "POST" "$API_BASE_URL/auth/register" \
    '{"name":"admin\"; DROP TABLE users; --","username":"test","email":"test@test.com","password":"Test123!"}' \
    400 \
    "SQL Injection in registration (name field)"

test_endpoint "POST" "$API_BASE_URL/auth/login" \
    '{"email":"admin@test.com\"; DROP TABLE users; --","password":"password"}' \
    400 \
    "SQL Injection in login (email field)"

# Test 2: XSS Prevention
echo ""
echo "Testing XSS Prevention..."
test_endpoint "POST" "$API_BASE_URL/auth/register" \
    '{"name":"<script>alert(\"xss\")</script>","username":"test2","email":"test2@test.com","password":"Test123!"}' \
    400 \
    "XSS in registration (name field)"

# Test 3: Rate Limiting
echo ""
echo "Testing Rate Limiting..."
log_info "Sending 6 rapid login requests to test rate limiting..."
for i in {1..6}; do
    response_code=$(curl -s -w '%{http_code}' -o /dev/null -X POST \
        -H "Content-Type: application/json" \
        -d '{"email":"nonexistent@test.com","password":"wrongpass"}' \
        "$API_BASE_URL/auth/login")
    
    if [ $i -eq 6 ] && [ "$response_code" -eq 429 ]; then
        log_success "Rate limiting working (6th request blocked)"
        break
    elif [ $i -eq 6 ]; then
        log_error "Rate limiting not working (6th request should be blocked)"
    fi
    
    sleep 0.5  # Small delay between requests
done

# Test 4: Password Strength Validation
echo ""
echo "Testing Password Strength Validation..."
weak_passwords=("password" "12345678" "abcdefgh" "PASSWORD123")
for pwd in "${weak_passwords[@]}"; do
    test_endpoint "POST" "$API_BASE_URL/auth/register" \
        "{\"name\":\"Test User\",\"username\":\"test$(date +%s)\",\"email\":\"test$(date +%s)@test.com\",\"password\":\"$pwd\"}" \
        400 \
        "Weak password rejection: $pwd"
done

# Test 5: Email Format Validation
echo ""
echo "Testing Email Format Validation..."
invalid_emails=("invalid-email" "test@" "@test.com" "test..test@test.com")
for email in "${invalid_emails[@]}"; do
    test_endpoint "POST" "$API_BASE_URL/auth/register" \
        "{\"name\":\"Test User\",\"username\":\"test$(date +%s)\",\"email\":\"$email\",\"password\":\"ValidPass123!\"}" \
        400 \
        "Invalid email rejection: $email"
done

# Test 6: JWT Token Validation
echo ""
echo "Testing JWT Token Validation..."

# Test with invalid token
curl -s -w '%{http_code}' -o /tmp/response_body \
    -H "Authorization: Bearer invalid.jwt.token" \
    "$API_BASE_URL/user/profile" | {
    read response_code
    if [ "$response_code" -eq 401 ]; then
        log_success "Invalid JWT token rejected"
    else
        log_error "Invalid JWT token not rejected properly"
    fi
}

# Test with no token
curl -s -w '%{http_code}' -o /tmp/response_body \
    "$API_BASE_URL/user/profile" | {
    read response_code
    if [ "$response_code" -eq 401 ]; then
        log_success "Request without token rejected"
    else
        log_error "Request without token not rejected properly"
    fi
}

# Test 7: CORS Headers
echo ""
echo "Testing CORS Configuration..."
cors_response=$(curl -s -I -X OPTIONS \
    -H "Origin: http://malicious-site.com" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" \
    "$API_BASE_URL/auth/login")

if echo "$cors_response" | grep -q "Access-Control-Allow-Origin"; then
    origin_header=$(echo "$cors_response" | grep "Access-Control-Allow-Origin" | cut -d: -f2 | tr -d ' \r')
    if [ "$origin_header" != "*" ]; then
        log_success "CORS properly configured (not allowing all origins)"
    else
        log_warning "CORS allows all origins (potential security risk)"
    fi
else
    log_success "CORS headers present"
fi

# Test 8: Security Headers
echo ""
echo "Testing Security Headers..."
security_response=$(curl -s -I "$API_BASE_URL/auth/login")

# Check for important security headers
if echo "$security_response" | grep -qi "x-content-type-options"; then
    log_success "X-Content-Type-Options header present"
else
    log_warning "X-Content-Type-Options header missing"
fi

if echo "$security_response" | grep -qi "x-frame-options"; then
    log_success "X-Frame-Options header present"
else
    log_warning "X-Frame-Options header missing"
fi

if echo "$security_response" | grep -qi "x-xss-protection"; then
    log_success "X-XSS-Protection header present"
else
    log_warning "X-XSS-Protection header missing"
fi

# Test 9: Request Size Limits
echo ""
echo "Testing Request Size Limits..."
large_payload=$(printf '{"name":"%s","username":"testuser","email":"test@test.com","password":"Test123!"}' "$(head -c 100000 < /dev/zero | tr '\0' 'A')")
response_code=$(curl -s -w '%{http_code}' -o /dev/null -X POST \
    -H "Content-Type: application/json" \
    -d "$large_payload" \
    "$API_BASE_URL/auth/register")

if [ "$response_code" -eq 413 ] || [ "$response_code" -eq 400 ]; then
    log_success "Large payload rejected (prevents DoS)"
else
    log_warning "Large payload not rejected (potential DoS vector)"
fi

# Test 10: Sensitive Information Exposure
echo ""
echo "Testing Information Disclosure..."
response_body=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"nonexistent@test.com","password":"wrongpass"}' \
    "$API_BASE_URL/auth/login")

if echo "$response_body" | grep -qi "stack" || echo "$response_body" | grep -qi "internal"; then
    log_error "Sensitive information exposed in error response"
else
    log_success "No sensitive information exposed in error response"
fi

echo ""
echo "🏁 Running Backend Unit Tests..."
echo "================================="

# Run Jest tests for backend
cd "$(dirname "$0")/../Backend"
if [ -f "package.json" ] && npm list jest &> /dev/null; then
    if npm test -- --testPathPattern=auth.*security 2>/dev/null; then
        log_success "Backend security unit tests passed"
    else
        log_error "Backend security unit tests failed"
    fi
else
    log_warning "Jest not found or not configured for backend tests"
fi

echo ""
echo "🎯 Running Frontend Tests..."
echo "============================="

# Run frontend tests if available
cd "$(dirname "$0")/../ONLINE-JUDGE-FRONTEND"
if [ -f "package.json" ] && npm list jest &> /dev/null; then
    if npm test -- --testPathPattern=auth.*security --watchAll=false 2>/dev/null; then
        log_success "Frontend security tests passed"
    else
        log_error "Frontend security tests failed"
    fi
else
    log_warning "Jest not found or not configured for frontend tests"
fi

echo ""
echo "📊 Test Summary"
echo "==============="

total_failed=${#FAILED_TESTS[@]}
if [ $total_failed -eq 0 ]; then
    echo -e "${GREEN}✅ All security tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ $total_failed test(s) failed:${NC}"
    for test in "${FAILED_TESTS[@]}"; do
        echo -e "  ${RED}•${NC} $test"
    done
    echo ""
    echo "🚨 Please review and fix the failed security tests before deploying to production."
    exit 1
fi
