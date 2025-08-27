# middleware.py
from django.http import HttpResponseForbidden

# class RoleCheckMiddleware:
#     def __init__(self, get_response):
#         self.get_response = get_response

#     def __call__(self, request):
#         if request.path.startswith('/pasteur/') and request.user.role != 'pasteur':
#             return HttpResponseForbidden()
#         return self.get_response(request)


import logging

class LoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.logger = logging.getLogger(__name__)

    def __call__(self, request):
        response = self.get_response(request)
        if request.path == '/evenements/calendar/' and 'filter=true' in request.GET.urlencode():
            self.logger.debug(f"Filter request: {request.GET}")
            self.logger.debug(f"Response status: {response.status_code}")
        return response