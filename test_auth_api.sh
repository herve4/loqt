#!/bin/bash
# Test authentication endpoints
# Usage: bash test_auth_api.sh

API_URL="http://localhost:8000/api"

echo "================================"
echo "Testing Authentication Endpoints"
echo "================================"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Login
echo -e "\n${YELLOW}Test 1: Login Endpoint${NC}"
echo "POST $API_URL/login/"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/login/" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user1@example.com",
    "password": "testpass123"
  }')

echo "$LOGIN_RESPONSE" | python -m json.tool 2>/dev/null || echo "$LOGIN_RESPONSE"

# Extract token from response
TOKEN=$(echo "$LOGIN_RESPONSE" | python -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)

if [ -n "$TOKEN" ]; then
  echo -e "${GREEN}✓ Login successful${NC}"
  echo "Token: $TOKEN"
else
  echo -e "${RED}✗ Login failed${NC}"
  exit 1
fi

# Test 2: Get User Profile
echo -e "\n${YELLOW}Test 2: Get User Profile${NC}"
echo "GET $API_URL/user/profile/"
curl -s -X GET "$API_URL/user/profile/" \
  -H "Authorization: Token $TOKEN" | python -m json.tool

# Test 3: Update User Profile
echo -e "\n${YELLOW}Test 3: Update User Profile${NC}"
echo "PATCH $API_URL/user/profile/"
curl -s -X PATCH "$API_URL/user/profile/" \
  -H "Authorization: Token $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Updated",
    "last_name": "Name"
  }' | python -m json.tool

# Test 4: Register New User
echo -e "\n${YELLOW}Test 4: Register New User${NC}"
echo "POST $API_URL/register/"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/register/" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "new_user@example.com",
    "phone": "+33712345678",
    "first_name": "New",
    "last_name": "User",
    "password": "newpass123",
    "password_confirm": "newpass123",
    "role": "membre",
    "accept_terms": true
  }')

echo "$REGISTER_RESPONSE" | python -m json.tool 2>/dev/null || echo "$REGISTER_RESPONSE"

# Extract new token
NEW_TOKEN=$(echo "$REGISTER_RESPONSE" | python -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)

# Test 5: Logout
echo -e "\n${YELLOW}Test 5: Logout${NC}"
echo "POST $API_URL/user/logout/"
curl -s -X POST "$API_URL/user/logout/" \
  -H "Authorization: Token $TOKEN" | python -m json.tool

# Test 6: Try to use deleted token (should fail)
echo -e "\n${YELLOW}Test 6: Verify Token Deleted (should fail)${NC}"
echo "GET $API_URL/user/profile/ (with deleted token)"
curl -s -X GET "$API_URL/user/profile/" \
  -H "Authorization: Token $TOKEN" | python -m json.tool

echo -e "\n${GREEN}✅ All manual tests completed${NC}"

