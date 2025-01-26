from django.urls import path
from . import views

urlpatterns = [
    path("getVideoFramesAtIntervals", views.getVideoFramesAtIntervals, name="Get Video Frames at Intervals"),
    path("getPostBackgroundMusic/<str:postId>", views.getPostBackgroundMusic, name="Get Post Background Music"),
    path("getVideoSubtitles/<str:videoId>", views.getVideoSubtitles, name="Get Video Subtitles"),
    path("getAIConvos/<str:username>", views.getAIConvos, name="Get AI Convos"),
    path("getAIMessages/<str:convoId>", views.getAIMessages, name="Get AI Messages"),
    path("getAIMessagesWithSent/<str:convoId>", views.getAIMessagesWithSent, name="Get AI Messages With Sent"),
    path("getAllAIConvos", views.getAllAIConvos, name="Get All AI Convos"),
    path("getAIConvotitle/<str:convoId>", views.getAIConvotitle, name="Get AI Convotitle")
]