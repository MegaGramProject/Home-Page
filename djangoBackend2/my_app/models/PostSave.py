from django.db import models


class PostSave(models.Model):
    id = models.BigAutoField(primary_key=True)
    overall_post_id = models.CharField(db_column='overallPostId', max_length=24)
    saver_id = models.IntegerField(db_column='saverId')

    class Meta:
        db_table = 'postSaves'
        unique_together = ('overall_post_id', 'saver_id')
