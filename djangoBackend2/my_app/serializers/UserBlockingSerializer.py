from rest_framework import serializers
from ..models import UserBlocking

class UserBlockingSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserBlocking
        fields = '__all__'
