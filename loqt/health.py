from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.db import connection

def database_health_check():
    """Vérifie que la connexion à la base de données est fonctionnelle."""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            return True, "Database connection is working"
    except Exception as e:
        return False, f"Database connection failed: {str(e)}"

@require_GET
def health_check(request):
    """Endpoint de santé pour vérifier que l'application est fonctionnelle."""
    # Vérifier la base de données
    db_ok, db_message = database_health_check()
    
    # Préparer la réponse
    status = 200 if db_ok else 503
    response_data = {
        "status": "healthy" if db_ok else "unhealthy",
        "checks": {
            "database": {
                "status": "ok" if db_ok else "error",
                "message": db_message
            }
        }
    }
    
    return JsonResponse(response_data, status=status)
