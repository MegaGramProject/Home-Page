from django.db import models


class FollowRequest(models.Model):
    id = models.BigAutoField(primary_key=True)
    requester = models.IntegerField(db_column='requester')
    requested = models.IntegerField(db_column='requested')


    class Meta:
        app_label = 'awsRDSMySQL'
        db_table = 'followRequests'
        unique_together = ('requester', 'requested')
