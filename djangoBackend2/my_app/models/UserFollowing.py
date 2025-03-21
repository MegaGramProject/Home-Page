from django.db import models


class UserFollowing(models.Model):
    id = models.BigAutoField(primary_key=True)
    follower = models.IntegerField(db_column='follower')
    followed = models.IntegerField(db_column='followed')

    class Meta:
        db_table = 'user_followings'
        unique_together = ('follower', 'followed')
