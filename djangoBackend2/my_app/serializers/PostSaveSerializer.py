from rest_framework import serializers
from ..models import PostSave

class PostSaveSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostSave
        fields = '__all__'
