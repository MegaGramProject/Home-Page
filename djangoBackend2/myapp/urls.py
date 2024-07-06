from django.urls import path
from . import views

urlpatterns = [
    path("getVideoFramesAtIntervals", views.getVideoFramesAtIntervals, name="Get Video Frames at Intervals"),
]