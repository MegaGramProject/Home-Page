from django.urls import path
from . import views

urlpatterns = [
    path("getVideoFrameAtTime", views.getVideoFrameAtTime, name="Get Video Frame"),
    path("changeQualityOfVideo/<str:quality>", views.changeQualityOfVideo, name="Change quality of video"),
]