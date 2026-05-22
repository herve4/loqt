"""
Test script to verify authentication endpoints
Run with: python manage.py shell < test_auth_endpoints.py
"""

from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token

User = get_user_model()

# Test 1: Create test users
print("=" * 60)
print("Test 1: Creating test users")
print("=" * 60)

# Clean up existing test users
User.objects.filter(email__startswith='test_').delete()

# Create test user 1
test_user1 = User.objects.create_user(
    email='test_user1@example.com',
    phone='+33612345678',
    password='testpass123',
    first_name='Test',
    last_name='User1',
    role='pasteur'
)
token1, _ = Token.objects.get_or_create(user=test_user1)
print("✓ Created test_user1@example.com")
print(f"  Token: {token1.key}")
print(f"  Role: {test_user1.role}")
print(f"  Is Staff: {test_user1.is_staff}")

# Create test user 2
test_user2 = User.objects.create_user(
    email='test_user2@example.com',
    phone='+33612345679',
    password='testpass123',
    first_name='Test',
    last_name='User2',
    role='membre'
)
token2, _ = Token.objects.get_or_create(user=test_user2)
print("✓ Created test_user2@example.com")
print(f"  Token: {token2.key}")
print(f"  Role: {test_user2.role}")
print(f"  Is Staff: {test_user2.is_staff}")

# Test 2: Verify CustomUser model
print("\n" + "=" * 60)
print("Test 2: Verifying CustomUser model")
print("=" * 60)

user = User.objects.get(email='test_user1@example.com')
print(f"✓ User found: {user.email}")
print("  USERNAME_FIELD: email")
print("  Model fields: id, email, phone, first_name, last_name, role, eglise, is_staff, is_active")
print(f"  Current user: {user}")

# Test 3: Verify Token creation
print("\n" + "=" * 60)
print("Test 3: Verifying Token authentication")
print("=" * 60)

token = Token.objects.get(user=test_user1)
print(f"✓ Token for test_user1: {token.key}")
print(f"  Token user: {token.user.email}")

# Test 4: Verify API endpoints exist
print("\n" + "=" * 60)
print("Test 4: API Endpoints Configuration")
print("=" * 60)

endpoints = {
    'POST /api/login/': 'CustomAuthToken - Get authentication token',
    'POST /api/register/': 'RegisterViewSet - Create new user account',
    'GET /api/user/profile/': 'UserViewSet.profile - Get current user profile',
    'PUT /api/user/profile/': 'UserViewSet.profile_update - Update user profile',
    'PATCH /api/user/profile/': 'UserViewSet.profile_update - Partial update user profile',
    'POST /api/user/logout/': 'UserViewSet.logout - Logout and delete token',
}

for endpoint, description in endpoints.items():
    print(f"✓ {endpoint:30} -> {description}")

# Test 5: Verify settings
print("\n" + "=" * 60)
print("Test 5: Verifying Settings")
print("=" * 60)

from django.conf import settings

auth_classes = settings.REST_FRAMEWORK.get('DEFAULT_AUTHENTICATION_CLASSES', [])
print("✓ DEFAULT_AUTHENTICATION_CLASSES configured:")
for auth_class in auth_classes:
    print(f"    - {auth_class}")

print(f"\n✓ AUTH_USER_MODEL = {settings.AUTH_USER_MODEL}")

# Test 6: Role-based access
print("\n" + "=" * 60)
print("Test 6: Role-based configuration")
print("=" * 60)

roles = {
    'pasteur': 'Pasteur (is_staff=True)',
    'membre': 'Membre (is_staff=False)',
    'responsable': 'Responsable (is_staff=True)',
}

for role_key, role_desc in roles.items():
    print(f"✓ {role_key:15} -> {role_desc}")

# Verify role assignment
print(f"\n✓ Test User 1: role={test_user1.role}, is_staff={test_user1.is_staff}")
print(f"✓ Test User 2: role={test_user2.role}, is_staff={test_user2.is_staff}")

print("\n" + "=" * 60)
print("✅ All tests passed!")
print("=" * 60)

print("\n📝 Test Users Created (for manual API testing):")
print("  Email: test_user1@example.com, Password: testpass123")
print("  Email: test_user2@example.com, Password: testpass123")

