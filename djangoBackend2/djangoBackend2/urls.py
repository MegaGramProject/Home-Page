from django.urls import path, include
from graphene_django.views import GraphQLView

urlpatterns = [
    path('', include("my_app.urls")),
    path("graphql/", GraphQLView.as_view(graphiql=True))
]