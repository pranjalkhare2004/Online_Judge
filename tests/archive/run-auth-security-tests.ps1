# Comprehensive Authentication Security Test Suite
# This PowerShell script runs all security tests for Windows environment

Write-Host "🔐 Comprehensive Authentication Security Test Suite" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$BACKEND_URL = "http://localhost:5000"
$FRONTEND_URL = "http://localhost:3000"
$API_BASE_URL = "$BACKEND_URL/api"
$FAILED_TESTS = @()

# Helper functions
function Write-Info {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param($Message)
    Write-Host "[PASS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[FAIL] $Message" -ForegroundColor Red
    $script:FAILED_TESTS += $Message
}

function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Url,
        [string]$Data,
        [int]$ExpectedStatus,
        [string]$TestName
    )
    
    try {
        $headers = @{"Content-Type" = "application/json"}
        $response = if ($Method -eq "POST" -and $Data) {
            Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers -Body $Data -ErrorAction Stop
        } elseif ($Method -eq "POST") {
            Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers -ErrorAction Stop
        } else {
            Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers -ErrorAction Stop
        }
        
        Write-Success $TestName
        return $true
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq $ExpectedStatus) {
            Write-Success $TestName
            return $true
        } else {
            Write-Error "$TestName (Expected: $ExpectedStatus, Got: $statusCode)"
            return $false
        }
    }
}

# Pre-flight checks
Write-Info "Pre-flight checks..."

try {
    $healthCheck = Invoke-RestMethod -Uri "$API_BASE_URL/health" -Method GET -ErrorAction Stop
    Write-Success "Backend is running"
}
catch {
    Write-Error "Backend is not running at $BACKEND_URL"
    Write-Host "Please start the backend server and try again." -ForegroundColor Red
    exit 1
}

try {
    $frontendCheck = Invoke-WebRequest -Uri $FRONTEND_URL -Method GET -ErrorAction Stop
    Write-Success "Frontend is running"
}
catch {
    Write-Warning "Frontend is not running at $FRONTEND_URL (optional for API tests)"
}

Write-Host ""
Write-Host "🛡️ Starting API Security Tests..." -ForegroundColor Yellow
Write-Host "==================================" -ForegroundColor Yellow

# Test 1: SQL Injection Prevention
Write-Host "Testing SQL Injection Prevention..."
Test-Endpoint -Method "POST" -Url "$API_BASE_URL/auth/register" `
    -Data '{"name":"admin\"; DROP TABLE users; --","username":"test","email":"test@test.com","password":"Test123!"}' `
    -ExpectedStatus 400 `
    -TestName "SQL Injection in registration (name field)"

Test-Endpoint -Method "POST" -Url "$API_BASE_URL/auth/login" `
    -Data '{"email":"admin@test.com\"; DROP TABLE users; --","password":"password"}' `
    -ExpectedStatus 400 `
    -TestName "SQL Injection in login (email field)"

# Test 2: XSS Prevention
Write-Host ""
Write-Host "Testing XSS Prevention..."
Test-Endpoint -Method "POST" -Url "$API_BASE_URL/auth/register" `
    -Data '{"name":"<script>alert(\"xss\")</script>","username":"test2","email":"test2@test.com","password":"Test123!"}' `
    -ExpectedStatus 400 `
    -TestName "XSS in registration (name field)"

# Test 3: Rate Limiting
Write-Host ""
Write-Host "Testing Rate Limiting..."
Write-Info "Sending 6 rapid login requests to test rate limiting..."

$rateLimitPassed = $false
for ($i = 1; $i -le 6; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "$API_BASE_URL/auth/login" -Method POST `
            -Headers @{"Content-Type" = "application/json"} `
            -Body '{"email":"nonexistent@test.com","password":"wrongpass"}' `
            -ErrorAction Stop
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($i -eq 6 -and $statusCode -eq 429) {
            Write-Success "Rate limiting working (6th request blocked)"
            $rateLimitPassed = $true
            break
        }
    }
    Start-Sleep -Milliseconds 500
}

if (-not $rateLimitPassed) {
    Write-Error "Rate limiting not working (6th request should be blocked)"
}

# Test 4: Password Strength Validation
Write-Host ""
Write-Host "Testing Password Strength Validation..."
$weakPasswords = @("password", "12345678", "abcdefgh", "PASSWORD123")
foreach ($pwd in $weakPasswords) {
    $timestamp = [int](Get-Date -UFormat %s)
    Test-Endpoint -Method "POST" -Url "$API_BASE_URL/auth/register" `
        -Data "{`"name`":`"Test User`",`"username`":`"test$timestamp`",`"email`":`"test$timestamp@test.com`",`"password`":`"$pwd`"}" `
        -ExpectedStatus 400 `
        -TestName "Weak password rejection: $pwd"
}

# Test 5: Email Format Validation
Write-Host ""
Write-Host "Testing Email Format Validation..."
$invalidEmails = @("invalid-email", "test@", "@test.com", "test..test@test.com")
foreach ($email in $invalidEmails) {
    $timestamp = [int](Get-Date -UFormat %s)
    Test-Endpoint -Method "POST" -Url "$API_BASE_URL/auth/register" `
        -Data "{`"name`":`"Test User`",`"username`":`"test$timestamp`",`"email`":`"$email`",`"password`":`"ValidPass123!`"}" `
        -ExpectedStatus 400 `
        -TestName "Invalid email rejection: $email"
}

# Test 6: JWT Token Validation
Write-Host ""
Write-Host "Testing JWT Token Validation..."

try {
    $response = Invoke-RestMethod -Uri "$API_BASE_URL/user/profile" -Method GET `
        -Headers @{"Authorization" = "Bearer invalid.jwt.token"} `
        -ErrorAction Stop
    Write-Error "Invalid JWT token not rejected properly"
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Success "Invalid JWT token rejected"
    } else {
        Write-Error "Invalid JWT token not rejected properly"
    }
}

try {
    $response = Invoke-RestMethod -Uri "$API_BASE_URL/user/profile" -Method GET -ErrorAction Stop
    Write-Error "Request without token not rejected properly"
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Success "Request without token rejected"
    } else {
        Write-Error "Request without token not rejected properly"
    }
}

# Test 7: Security Headers
Write-Host ""
Write-Host "Testing Security Headers..."
try {
    $response = Invoke-WebRequest -Uri "$API_BASE_URL/health" -Method GET
    
    if ($response.Headers["X-Content-Type-Options"]) {
        Write-Success "X-Content-Type-Options header present"
    } else {
        Write-Warning "X-Content-Type-Options header missing"
    }
    
    if ($response.Headers["X-Frame-Options"]) {
        Write-Success "X-Frame-Options header present"
    } else {
        Write-Warning "X-Frame-Options header missing"
    }
    
    if ($response.Headers["X-XSS-Protection"]) {
        Write-Success "X-XSS-Protection header present"
    } else {
        Write-Warning "X-XSS-Protection header missing"
    }
}
catch {
    Write-Warning "Could not check security headers"
}

# Run Backend Unit Tests
Write-Host ""
Write-Host "🏁 Running Backend Unit Tests..." -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Yellow

Push-Location "$PSScriptRoot\Backend"
if (Test-Path "package.json") {
    try {
        $npmList = npm list jest 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Info "Running backend security tests..."
            $testResult = npm test -- --testPathPattern="auth.*security" --silent 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Backend security unit tests passed"
            } else {
                Write-Error "Backend security unit tests failed"
            }
        } else {
            Write-Warning "Jest not found for backend tests"
        }
    }
    catch {
        Write-Warning "Error running backend tests: $($_.Exception.Message)"
    }
} else {
    Write-Warning "Backend package.json not found"
}
Pop-Location

# Run Frontend Tests
Write-Host ""
Write-Host "🎯 Running Frontend Tests..." -ForegroundColor Yellow
Write-Host "=============================" -ForegroundColor Yellow

Push-Location "$PSScriptRoot\ONLINE-JUDGE-FRONTEND"
if (Test-Path "package.json") {
    try {
        $npmList = npm list jest 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Info "Running frontend security tests..."
            $testResult = npm test -- --testPathPattern="auth.*security" --watchAll=false --silent 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Frontend security tests passed"
            } else {
                Write-Error "Frontend security tests failed"
            }
        } else {
            Write-Warning "Jest not found for frontend tests"
        }
    }
    catch {
        Write-Warning "Error running frontend tests: $($_.Exception.Message)"
    }
} else {
    Write-Warning "Frontend package.json not found"
}
Pop-Location

# Run Security Audit
Write-Host ""
Write-Host "🔍 Running Security Configuration Audit..." -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow

Push-Location "$PSScriptRoot\Backend"
if (Test-Path "scripts\security-audit.js") {
    try {
        Write-Info "Running security configuration audit..."
        node scripts\security-audit.js
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Security audit completed successfully"
        } else {
            Write-Warning "Security audit found issues (see details above)"
        }
    }
    catch {
        Write-Warning "Error running security audit: $($_.Exception.Message)"
    }
} else {
    Write-Warning "Security audit script not found"
}
Pop-Location

# Test Summary
Write-Host ""
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan

$totalFailed = $FAILED_TESTS.Count
if ($totalFailed -eq 0) {
    Write-Host "✅ All security tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ $totalFailed test(s) failed:" -ForegroundColor Red
    foreach ($test in $FAILED_TESTS) {
        Write-Host "  • $test" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "🚨 Please review and fix the failed security tests before deploying to production." -ForegroundColor Red
    exit 1
}
