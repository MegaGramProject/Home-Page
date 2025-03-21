from django.db import models


class UserBlocking(models.Model):
    id = models.BigAutoField(primary_key=True)
    blocker = models.IntegerField(db_column='blocker')
    blocked = models.IntegerField(db_column='blocked')


    class Meta:
        app_label = 'azureFlexibleServerPSQL'
        db_table = 'user_blockings'
        unique_together = ('blocker', 'blocked')
