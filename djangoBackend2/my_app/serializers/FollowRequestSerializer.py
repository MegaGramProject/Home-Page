from rest_framework import serializers
from ..models import FollowRequest


class FollowRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = FollowRequest
        fields = '__all__'
