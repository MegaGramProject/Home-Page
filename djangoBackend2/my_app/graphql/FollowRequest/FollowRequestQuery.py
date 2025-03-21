from ...models import FollowRequest
from ...services import authenticate_user

import graphene
from graphql import GraphQLError

from datetime import datetime


class Query(graphene.ObjectType):
    get_batch_of_my_received_follow_requests = graphene.List(
        graphene.Int,
        auth_user_id=graphene.Int(required=True),
        requester_ids_to_exclude=graphene.List(graphene.Int, required=False)
    )

    get_batch_of_my_sent_follow_requests = graphene.List(
        graphene.Int,
        auth_user_id=graphene.Int(required=True),
        requested_ids_to_exclude=graphene.List(graphene.Int, required=False)
    )


    def resolve_get_batch_of_my_received_follow_requests(root, info, auth_user_id, requester_ids_to_exclude):
        if auth_user_id < 1 :
            raise GraphQLError(f'There does not exist a user with the provided auth_user_id')

        request = info.context
        user_authentication_result = authenticate_user(request, auth_user_id)

        if isinstance(user_authentication_result, bool):
            if not user_authentication_result:
                raise GraphQLError(f'The expressJSBackend1 server could not verify you as having the proper credentials to be logged in
                as {auth_user_id}')
        elif isinstance(user_authentication_result, str):
            if user_authentication_result == 'The provided authUser token, if any, in your cookies has an invalid structure.':
                raise GraphQLError(user_authentication_result)
            raise GraphQLError(user_authentication_result)
        else:
            refreshed_auth_token, expiration_date = user_authentication_result
            expires_timestamp = datetime.datetime.fromtimestamp(expiration_date).strftime('%a, %d-%b-%Y %H:%M:%S GMT')
            response = info.context.response
            response.set_cookie(f'authToken{auth_user_id}', refreshed_auth_token, expires=expires_timestamp, httponly=True,
            path='/', secure=True, httponly=True)
        

        if requester_ids_to_exclude is None:
            requester_ids_to_exclude = []
        requester_ids_to_exclude = [x for x in requester_ids_to_exclude if x > 0]
        set_of_requester_ids_to_exclude = set(requester_ids_to_exclude)

        try:
            batch_of_follow_requests_received_by_auth_user = (FollowRequest.objects
                .filter(requested=auth_user_id)
                .exclude(requester__in=set_of_requester_ids_to_exclude)
                .values_list('requester', flat=True)
                [:10]
            )
            return batch_of_follow_requests_received_by_auth_user
        except:
            raise GraphQLError(f'There was trouble getting the batch of follow-requests received by user {auth_user_id}')
        


    def resolve_get_batch_of_my_sent_follow_requests(root, info, auth_user_id, requested_ids_to_exclude):
        if auth_user_id < 1 :
            raise GraphQLError(f'There does not exist a user with the provided auth_user_id')

        request = info.context
        user_authentication_result = authenticate_user(request, auth_user_id)

        if isinstance(user_authentication_result, bool):
            if not user_authentication_result:
                raise GraphQLError(f'The expressJSBackend1 server could not verify you as having the proper credentials to be logged in
                as {auth_user_id}')
        elif isinstance(user_authentication_result, str):
            if user_authentication_result == 'The provided authUser token, if any, in your cookies has an invalid structure.':
                raise GraphQLError(user_authentication_result)
            raise GraphQLError(user_authentication_result)
        else:
            refreshed_auth_token, expiration_date = user_authentication_result
            expires_timestamp = datetime.datetime.fromtimestamp(expiration_date).strftime('%a, %d-%b-%Y %H:%M:%S GMT')
            response = info.context.response
            response.set_cookie(f'authToken{auth_user_id}', refreshed_auth_token, expires=expires_timestamp, httponly=True,
            path='/', secure=True, httponly=True)
        
        
        if requested_ids_to_exclude is None:
            requested_ids_to_exclude = []
        requested_ids_to_exclude = [x for x in requested_ids_to_exclude if x > 0]
        set_of_requested_ids_to_exclude = set(requested_ids_to_exclude)

        try:
            batch_of_follow_requests_sent_by_auth_user = (FollowRequest.objects
                .filter(requester=auth_user_id)
                .exclude(requested__in=set_of_requested_ids_to_exclude)
                .values_list('requested', flat=True)
                [:10]
            )
            return batch_of_follow_requests_sent_by_auth_user
        except:
            raise GraphQLError(f'There was trouble getting the batch of follow-requests sent by user {auth_user_id}')
        
    