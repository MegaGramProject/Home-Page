import graphene


class FollowRequestInfoType(graphene.ObjectType):
    requester = graphene.Int()
    requestee = graphene.Int() 