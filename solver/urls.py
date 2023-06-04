from django.urls import path
from . import solve_controller, views

urlpatterns = [
    path('', views.home),
    path('solve', solve_controller.solve),
    path('validate', solve_controller.validate),
]