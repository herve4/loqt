import datetime

def static_version(request):
    """
    Fournit une version unique à injecter dans les URLs statiques pour contourner le cache.
    """
    version = datetime.datetime.now().strftime("%Y%m%d%H%M")  # ex: 202506232359
    return {
        'STATIC_VERSION': version
    }
