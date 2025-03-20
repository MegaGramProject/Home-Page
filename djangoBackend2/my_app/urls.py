from django.urls import path
from . import views

urlpatterns = [
    path("getBatchOfSaversOfOwnPost/<int:auth_user_id>/<str:overall_post_id>", views.get_batch_of_savers_of_own_post, name=f"Get Batch
    of Savers Of Own Post"),
    path("savePost/<int:auth_user_id>/<str:overall_post_id>", views.save_post, name="Save Post"),
    path("toggleSavePost/<int:auth_user_id>/<str:overall_post_id>", views.toggle_save_post, name="Toggle Save Post"),
    path("removeSaveFromPost/<int:auth_user_id>/<str:overall_post_id>", views.remove_save_from_post,
    name="Remove Save from Post"),

    path("getBatchOfThoseBlockedByMe/<int:auth_user_id>", views.get_batch_of_those_blocked_by_me, name=f"Get Batch of Those Blocked
    by Me"),
    path("blockUser/<int:auth_user_id>/<int:id_of_user_to_block>", views.block_user, name="Block User"),
    path("toggleBlockUser/<int:auth_user_id>/<int:id_of_user_to_toggle_block", views.toggle_block_user, name="Toggle Block User"),
    path("unblockUser/<int:auth_user_id>/<int:id_of_user_to_unblock>", views.unblock_user, name="Unblock User"),
]