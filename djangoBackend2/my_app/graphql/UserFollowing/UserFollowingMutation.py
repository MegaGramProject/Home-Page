from ...models import UserFollowing
from ...serializers import UserFollowingSerializer, FollowRequestSerializer
from ...services import authenticate_user, check_if_user_exists, check_if_user_exists_and_is_private

import graphene
from graphql import GraphQLError

from datetime import datetime


class FollowUser(graphene.Mutation):
    class Arguments:
        auth_user_id = graphene.Int(required=True)
        id_of_user_to_follow = graphene.Int(required=True)

    id_of_new_user_following = graphene.Int()


    def mutate(self, info, auth_user_id, id_of_user_to_follow):
        if auth_user_id < 1:
            raise GraphQLError(f'There does not exist a user with the provided auth_user_id.')

        if id_of_user_to_follow < 1:
            raise GraphQLError(f'There does not exist a user with the provided id_of_user_to_follow.')
        
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
        

        result_of_checking_if_user_exists = check_if_user_exists(auth_user_id, id_of_user_to_follow)
        if isinstance(result_of_checking_if_user_exists, list):
            raise GraphQLError(result_of_checking_if_user_exists[0])
        elif isinstance(result_of_checking_if_user_exists, bool):
            if not result_of_checking_if_user_exists:
                raise GraphQLError('The user you are trying to follow does not exist')

        new_user_following_serializer = UserFollowingSerializer(data={
            'follower': auth_user_id,
            'followed': id_of_user_to_follow
        })

        try:
            if new_user_following_serializer.is_valid():
                new_user_following = new_user_following_serializer.save()
            return FollowUser(id_of_new_user_following = new_user_following.id)
        except:
            raise GraphQLError('There was trouble adding the user-following into the database')
        
    
class ToggleFollowUser(graphene.Mutation):
    class Arguments:
        auth_user_id = graphene.Int(required=True)
        user_id_to_toggle_follow = graphene.Int(required=True)

    new_following_status = graphene.String()


    def mutate(self, info, auth_user_id, user_id_to_toggle_follow):
        if auth_user_id < 1:
            raise GraphQLError(f'There does not exist a user with the provided auth_user_id.')

        if user_id_to_toggle_follow < 1:
            raise GraphQLError(f'There does not exist a user with the provided user_id_to_toggle_follow.')
        
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
        
        user_is_private = None

        result_of_checking_if_user_exists_and_is_private = check_if_user_exists_and_is_private(
            auth_user_id, user_id_to_toggle_follow
        )
        if isinstance(result_of_checking_if_user_exists_and_is_private, list):
            raise GraphQLError(result_of_checking_if_user_exists_and_is_private[0])
        elif isinstance(result_of_checking_if_user_exists_and_is_private, str):
            if result_of_checking_if_user_exists_and_is_private == 'does not exist':
                raise GraphQLError('The user you are trying to toggle-follow does not exist')
            elif result_of_checking_if_user_exists_and_is_private == 'public':
                user_is_private = False
            else:
                user_is_private = True
            
        try:
            user_following_to_delete = UserFollowing.objects.get(
                follower = auth_user_id,
                followed = user_id_to_toggle_follow
            )
            user_following_to_delete.delete()
            return ToggleFollowUser(new_following_status = 'Stranger')
        except UserFollowing.DoesNotExist:
            pass
        except:
            raise GraphQLError('There was trouble removing the user-following, if it even exists, from the database')
        
        if user_is_private:
            new_follow_request_serializer = FollowRequestSerializer(data={
                'requester': auth_user_id,
                'requested': user_id_to_toggle_follow
            })
            if new_follow_request_serializer.is_valid():
                try:
                    new_follow_request_serializer.save()
                    return ToggleFollowUser(new_following_status = 'Requested')
                except:
                    raise GraphQLError('There was trouble adding the follow-request into the database')
        else:
            new_user_following_serializer = UserFollowingSerializer(data={
                'follower': auth_user_id,
                'followed': user_id_to_toggle_follow
            })
            if new_user_following_serializer.is_valid():
                try:
                    new_user_following_serializer.save()
                    return ToggleFollowUser(new_following_status = 'Following')
                except:
                    raise GraphQLError('There was trouble adding the user-following into the database')


class UnfollowUser(graphene.Mutation):
    class Arguments:
        auth_user_id = graphene.Int(required=True)
        id_of_user_to_unfollow = graphene.Int(required=True)

    was_user_following_found = graphene.Boolean()


    def mutate(self, info, auth_user_id, id_of_user_to_unfollow):
        if auth_user_id < 1:
            raise GraphQLError(f'There does not exist a user with the provided auth_user_id.')

        if id_of_user_to_unfollow < 1:
            raise GraphQLError(f'There does not exist a user with the provided id_of_user_to_unfollow.')
        
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
            user_following_to_remove = UserFollowing.objects.get(
                follower = auth_user_id,
                followed = id_of_user_to_unfollow
            )
            user_following_to_remove.delete()
            return UnfollowUser(was_user_following_found=True)
        
        except UserFollowing.DoesNotExist:
            return UnfollowUser(was_user_following_found=False)

        except:
            raise GraphQLError('There was trouble removing the user-following from the database')


class Mutation(graphene.ObjectType):
    follow_user = FollowUser.Field()
    toggle_follow_user = ToggleFollowUser.Field()
    unfollow_user = UnfollowUser.Field()
