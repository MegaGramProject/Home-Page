from rest_framework import serializers
from ..models import UserFollowing

class UserFollowingSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserFollowing
        fields = '__all__'
