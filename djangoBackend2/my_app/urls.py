from django.urls import path
from . import views

urlpatterns = [
    path("getBatchOfSaversOfOwnPost/<int:auth_user_id>/<str:overall_post_id>", views.get_batch_of_savers_of_own_post,
    name="Get Batch of Savers Of Own Post"),
    path("savePost/<int:auth_user_id>/<str:overall_post_id>", views.save_post, name="Save Post"),
    path("toggleSavePost/<int:auth_user_id>/<str:overall_post_id>", views.toggle_save_post, name="Toggle Save Post"),
    path("removeSaveFromPost/<int:auth_user_id>/<str:overall_post_id>", views.remove_save_from_post,
    name="Remove Save from Post")
]