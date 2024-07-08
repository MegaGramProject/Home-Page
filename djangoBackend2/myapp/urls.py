from django.urls import path
from . import views

urlpatterns = [
    path("getVideoFramesAtIntervals", views.getVideoFramesAtIntervals, name="Get Video Frames at Intervals"),
    path("getPostBackgroundMusic/<str:postId>", views.getPostBackgroundMusic, name="Get Post Background Music"),
]