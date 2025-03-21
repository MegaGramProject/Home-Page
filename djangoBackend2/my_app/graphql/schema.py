import graphene

from .UserFollowing import Query as UserFollowingQuery, Mutation as UserFollowingMutation
from .FollowRequest import Query as FollowRequestQuery, Mutation as FollowRequestMutation


class CombinedQuery(UserFollowingQuery, FollowRequestQuery, graphene.ObjectType):
    pass

class CombinedMutation(UserFollowingMutation, FollowRequestMutation, graphene.ObjectType):
    pass


schema = graphene.Schema(query=CombinedQuery, mutation=CombinedMutation)