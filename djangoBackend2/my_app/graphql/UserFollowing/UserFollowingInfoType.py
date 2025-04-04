import graphene


class UserFollowingInfoType(graphene.ObjectType):
    follower = graphene.Int()
    followee = graphene.Int() 