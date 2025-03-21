from ...models import FollowRequest, UserFollowing
from ...serializers import FollowRequestSerializer, UserFollowingSerializer
from ...services import authenticate_user, check_if_user_exists_and_is_private

import graphene
from graphql import GraphQLError

from datetime import datetime


class RequestToFollowUser(graphene.Mutation):
    class Arguments:
        auth_user_id = graphene.Int(required=True)
        id_of_user_to_request_to_follow = graphene.Int(required=True)

    id_of_new_follow_request = graphene.Int()


    def mutate(self, info, auth_user_id, id_of_user_to_request_to_follow):
        if auth_user_id < 1:
            raise GraphQLError(f'There does not exist a user with the provided auth_user_id.')

        if id_of_user_to_request_to_follow < 1:
            raise GraphQLError(f'There does not exist a user with the provided id_of_user_to_request_to_follow.')
        
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
        

        result_of_checking_if_user_exists_and_is_private = check_if_user_exists_and_is_private(
            auth_user_id,
            id_of_user_to_request_to_follow
        )
        if isinstance(result_of_checking_if_user_exists_and_is_private, list):
            raise GraphQLError(result_of_checking_if_user_exists_and_is_private[0])
        elif isinstance(result_of_checking_if_user_exists_and_is_private, str):
            if result_of_checking_if_user_exists_and_is_private == 'public':
                raise GraphQLError('The user you are trying to request to follow has a public-account, not a private one!')
            elif result_of_checking_if_user_exists_and_is_private == 'does not exist':
                raise GraphQLError('The user you are trying to request to follow does not exist')


        new_follow_request_serializer = FollowRequestSerializer(data={
            'requester': auth_user_id,
            'requested': id_of_user_to_request_to_follow
        })

        try:
            if new_follow_request_serializer.is_valid():
                new_follow_request = new_follow_request_serializer.save()
            return RequestToFollowUser(id_of_new_follow_request = new_follow_request.id)
        except:
            raise GraphQLError('There was trouble adding the follow-request into the database')


class CancelFollowRequestToOrFromUser(graphene.Mutation):
    class Arguments:
        auth_user_id = graphene.Int(required=True)
        id_of_user_to_cancel_request = graphene.Int(required=True)
        auth_user_is_recipient_of_request = graphene.Boolean(required=True)

    follow_request_was_found = graphene.Boolean()


    def mutate(self, info, auth_user_id, id_of_user_to_cancel_request, auth_user_is_recipient_of_request):
        if auth_user_id < 1:
            raise GraphQLError(f'There does not exist a user with the provided auth_user_id.')

        if id_of_user_to_cancel_request < 1:
            raise GraphQLError(f'There does not exist a user with the provided id_of_user_to_cancel_request.')
        
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
        

        try:
            follow_request_to_delete = None
            if auth_user_is_recipient_of_request:
                follow_request_to_delete = FollowRequest.objects.get(
                    requester = id_of_user_to_cancel_request,
                    requested = auth_user_id
                )
            else:
                follow_request_to_delete = FollowRequest.objects.get(
                    requester = auth_user_id,
                    requested = id_of_user_to_cancel_request
                )

            follow_request_to_delete.delete() 

            return CancelFollowRequestToOrFromUser(follow_request_was_found = True)
        
        except FollowRequest.DoesNotExist:
            return CancelFollowRequestToOrFromUser(follow_request_was_found = False)
        
        except:
            raise GraphQLError('There was trouble removing the follow-request, if it even exists, from the database')


class ToggleFollowRequestToUser(graphene.Mutation):
    class Arguments:
        auth_user_id = graphene.Int(required=True)
        id_of_user_to_toggle_request = graphene.Int(required=True)

    result_of_toggle_follow_request = graphene.String()


    def mutate(self, info, auth_user_id, id_of_user_to_toggle_request):
        if auth_user_id < 1:
            raise GraphQLError(f'There does not exist a user with the provided auth_user_id.')

        if id_of_user_to_toggle_request < 1:
            raise GraphQLError(f'There does not exist a user with the provided id_of_user_to_toggle_request.')
            
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

        try:
            follow_request_to_delete = None
            follow_request_to_delete = FollowRequest.objects.get(
                requester = auth_user_id,
                requested = id_of_user_to_toggle_request
            )

            follow_request_to_delete.delete() 

            return ToggleFollowRequestToUser(result_of_toggle_follow_request = 'Follow-request cancelled successfully')
        
        except FollowRequest.DoesNotExist:
            result_of_checking_if_user_exists_and_is_private = check_if_user_exists_and_is_private(
                auth_user_id,
                id_of_user_to_toggle_request
            )
            if isinstance(result_of_checking_if_user_exists_and_is_private, list):
                raise GraphQLError(result_of_checking_if_user_exists_and_is_private[0])
            elif isinstance(result_of_checking_if_user_exists_and_is_private, str):
                if result_of_checking_if_user_exists_and_is_private == 'public':
                    raise GraphQLError('The user you are trying to request to follow has a public-account, not a private one!')
                elif result_of_checking_if_user_exists_and_is_private == 'does not exist':
                    raise GraphQLError('The user you are trying to request to follow does not exist')
        
        except:
            raise GraphQLError('There was trouble removing the follow-request, if it even exists, from the database')

        
        new_follow_request_serializer = FollowRequestSerializer(data={
            'requester': auth_user_id,
            'requested': id_of_user_to_toggle_request
        })

        try:
            if new_follow_request_serializer.is_valid():
                new_follow_request = new_follow_request_serializer.save()
            return ToggleFollowRequestToUser(result_of_toggle_follow_request = str(new_follow_request.id))
        except:
            raise GraphQLError('There was trouble adding the follow-request into the database')


class AcceptFollowRequestFromUser(graphene.Mutation):
    class Arguments:
        auth_user_id = graphene.Int(required=True)
        id_of_user_to_accept = graphene.Int(required=True)

    id_of_new_user_following = graphene.Int()


    def mutate(self, info, auth_user_id, id_of_user_to_accept):
        if auth_user_id < 1:
            raise GraphQLError(f'There does not exist a user with the provided auth_user_id.')

        if id_of_user_to_accept < 1:
            raise GraphQLError(f'There does not exist a user with the provided id_of_user_to_accept.')
        
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
        

        try:
            follow_request_to_delete = None
            follow_request_to_delete = FollowRequest.objects.get(
                requester = id_of_user_to_accept,
                requested = auth_user_id
            )

            follow_request_to_delete.delete() 

        except FollowRequest.DoesNotExist:
            raise GraphQLError('You cannot accept a follow-request that does not exist')
       
        except:
            raise GraphQLError('There was trouble deleting the follow-request from the database')
        
        new_user_following_serializer = UserFollowingSerializer(data={
            'follower': id_of_user_to_accept,
            'followed': auth_user_id
        })

        try:
            if new_user_following_serializer.is_valid():
                new_user_following = new_user_following_serializer.save()
            return AcceptFollowRequestFromUser(id_of_new_user_following = new_user_following.id)
        except:
            raise GraphQLError('There was trouble adding the user-following into the database')


class AcceptAllFollowRequestsAfterGoingPublic(graphene.Mutation):
    class Arguments:
        auth_user_id = graphene.Int(required=True)

    num_followers_added = graphene.Int()


    def mutate(self, info, auth_user_id):

        follow_requests_to_delete = None
        try:    
            follow_requests_to_delete = FollowRequest.objects.filter(requested=auth_user_id)

            if not follow_requests_to_delete.exists():
                return AcceptAllFollowRequestsAfterGoingPublic(num_followers_added = 0)

            follow_requests_to_delete.delete()
        except:
            raise GraphQLError('There was trouble in the process of getting all the follow-requests and deleting them')


        user_followings_to_add = [
            UserFollowing(
                follower=fr.requester,
                followed=auth_user_id
            )
            for fr in follow_requests_to_delete
        ]

        try:
            UserFollowing.objects.bulk_create(user_followings_to_add)
            return AcceptAllFollowRequestsAfterGoingPublic(num_followers_added=len(user_followings_to_add))
        except:
            raise GraphQLError('There was trouble converting all the follow-requests into followers in the database')


class Mutation(graphene.ObjectType):
    request_to_follow_user = RequestToFollowUser.Field()
    cancel_follow_request_to_or_from_user = CancelFollowRequestToOrFromUser.Field()
    toggle_follow_request_to_user = ToggleFollowRequestToUser.Field()
    accept_follow_request_from_user = AcceptFollowRequestFromUser.Field()
    accept_all_follow_requests_after_going_public = AcceptAllFollowRequestsAfterGoingPublic.Field()