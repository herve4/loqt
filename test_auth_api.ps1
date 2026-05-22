@echo off
REM Test authentication endpoints (Windows PowerShell version)
REM Run with: powershell -ExecutionPolicy Bypass -File test_auth_api.ps1

$API_URL = "http://localhost:8000/api"

Write-Host "================================" -ForegroundColor Yellow
Write-Host "Testing Authentication Endpoints" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow

# Test 1: Login
Write-Host "`nTest 1: Login Endpoint" -ForegroundColor Cyan
Write-Host "POST $API_URL/login/"

$loginBody = @{
    username = "test_user1@example.com"
    password = "testpass123"
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri "$API_URL/login/" `
    -Method Post `
    -Headers @{"Content-Type" = "application/json"} `
    -Body $loginBody | ConvertFrom-Json

Write-Host ($loginResponse | ConvertTo-Json -Depth 10)

$token = $loginResponse.token
if ($token) {
    Write-Host "✓ Login successful" -ForegroundColor Green
    Write-Host "Token: $token"
} else {
    Write-Host "✗ Login failed" -ForegroundColor Red
    exit 1
}

# Test 2: Get User Profile
Write-Host "`nTest 2: Get User Profile" -ForegroundColor Cyan
Write-Host "GET $API_URL/user/profile/"
$profileResponse = Invoke-WebRequest -Uri "$API_URL/user/profile/" `
    -Method Get `
    -Headers @{"Authorization" = "Token $token"} | ConvertFrom-Json
Write-Host ($profileResponse | ConvertTo-Json -Depth 10)

# Test 3: Update User Profile
Write-Host "`nTest 3: Update User Profile" -ForegroundColor Cyan
Write-Host "PATCH $API_URL/user/profile/"
$updateBody = @{
    first_name = "Updated"
    last_name = "Name"
} | ConvertTo-Json

$updateResponse = Invoke-WebRequest -Uri "$API_URL/user/profile/" `
    -Method Patch `
    -Headers @{"Authorization" = "Token $token"; "Content-Type" = "application/json"} `
    -Body $updateBody | ConvertFrom-Json
Write-Host ($updateResponse | ConvertTo-Json -Depth 10)

# Test 4: Register New User
Write-Host "`nTest 4: Register New User" -ForegroundColor Cyan
Write-Host "POST $API_URL/register/"
$registerBody = @{
    email = "new_user@example.com"
    phone = "+33712345678"
    first_name = "New"
    last_name = "User"
    password = "newpass123"
    password_confirm = "newpass123"
    role = "membre"
    accept_terms = $true
} | ConvertTo-Json

$registerResponse = Invoke-WebRequest -Uri "$API_URL/register/" `
    -Method Post `
    -Headers @{"Content-Type" = "application/json"} `
    -Body $registerBody | ConvertFrom-Json
Write-Host ($registerResponse | ConvertTo-Json -Depth 10)

$newToken = $registerResponse.token

# Test 5: Logout
Write-Host "`nTest 5: Logout" -ForegroundColor Cyan
Write-Host "POST $API_URL/user/logout/"
$logoutResponse = Invoke-WebRequest -Uri "$API_URL/user/logout/" `
    -Method Post `
    -Headers @{"Authorization" = "Token $token"} | ConvertFrom-Json
Write-Host ($logoutResponse | ConvertTo-Json -Depth 10)

# Test 6: Try to use deleted token (should fail)
Write-Host "`nTest 6: Verify Token Deleted (should fail)" -ForegroundColor Cyan
Write-Host "GET $API_URL/user/profile/ (with deleted token)"
try {
    $failResponse = Invoke-WebRequest -Uri "$API_URL/user/profile/" `
        -Method Get `
        -Headers @{"Authorization" = "Token $token"}
} catch {
    Write-Host ($_.Exception.Response | ConvertFrom-Json | ConvertTo-Json -Depth 10) -ForegroundColor Red
}

Write-Host "`n✅ All manual tests completed" -ForegroundColor Green

