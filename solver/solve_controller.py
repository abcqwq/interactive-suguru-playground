from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from . import solver

import json

@require_http_methods(['POST'])
def solve(request):
    return JsonResponse(solver.solve(json.loads(request.body)))

@require_http_methods(['POST'])
def validate(request):
    return JsonResponse(solver.validate(json.loads(request.body)))