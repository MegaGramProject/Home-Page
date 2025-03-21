from ..models import UserFollowing, UserBlocking
from ..serializers import UserFollowingSerializer

import graphene
from graphene_django.types import DjangoObjectType
from graphql import GraphQLError

import requests
from datetime import datetime
import base64

from django.db.models import Count, Q



class UserFollowingType(DjangoObjectType):
    class Meta:
        model = UserFollowing


class Query(graphene.ObjectType):
    get_batch_of_followers_of_user = graphene.List(
        graphene.Int,
        auth_user_id=graphene.Int(required=True),
        user_id=graphene.Int(required=True),
        follower_ids_to_exclude=graphene.List(graphene.Int, required=False)
    )

    get_batch_of_followings_of_user = graphene.List(
        graphene.Int,
        auth_user_id=graphene.Int(required=True),
        user_id=graphene.Int(required=True),
        following_ids_to_exclude=graphene.List(graphene.Int, required=False)
    )

    get_num_followers_and_num_followings_of_user = graphene.List(
        graphene.Int,
        auth_user_id=graphene.Int(required=True),
        user_id=graphene.Int(required=True)
    )

    get_num_followers_and_num_followings_of_multiple_users = graphene.List(
        graphene.List(graphene.Int),
        user_ids=graphene.List(graphene.Int, required=True)
    )


    def resolve_get_batch_of_followers_of_user(root, info, auth_user_id, user_id, follower_ids_to_exclude):
        if auth_user_id < 1 and auth_user_id != -1:
            raise GraphQLError(f'There does not exist a user with the provided auth_user_id. If you are an anonymous-guest,
            set auth_user_id to -1')

        if user_id < 1:
            raise GraphQLError(f'There does not exist a user with the provided user_id.')
        
        auth_user_is_anonymous_guest = auth_user_id == -1

        refreshed_auth_token = None
        expires_timestamp = None
        if not auth_user_is_anonymous_guest:
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

        
        result_of_checking_if_auth_user_has_access_to_user = check_if_auth_user_has_access_to_user(
            auth_user_id,
            user_id
        )
        if isinstance(result_of_checking_if_auth_user_has_access_to_user, list):
            raise GraphQLError(result_of_checking_if_auth_user_has_access_to_user[0])
        
        elif isinstance(result_of_checking_if_auth_user_has_access_to_user, str):
            if result_of_checking_if_auth_user_has_access_to_user == 'Does not follow private user':
                raise GraphQLError('You cannot access the followers of a private-user that you do not follow')
            return []
        

        if follower_ids_to_exclude is None:
            follower_ids_to_exclude = []
        follower_ids_to_exclude = [x for x in follower_ids_to_exclude if x > 0] 

        try:
            batch_of_followers_of_user = (UserFollowing.objects
                .filter(followed=user_id)
                .exclude(follower__in=follower_ids_to_exclude)
                .values_list('follower', flat=True)
                [:10]
            )
            return batch_of_followers_of_user
        except:
            raise GraphQLError(f'There was trouble getting the batch of followers of user {user_id}')


    def resolve_get_batch_of_followings_of_user(root, info, auth_user_id, user_id, following_ids_to_exclude):
        if auth_user_id < 1 and auth_user_id != -1:
            raise GraphQLError(f'There does not exist a user with the provided auth_user_id. If you are an anonymous-guest,
            set auth_user_id to -1')

        if user_id < 1:
            raise GraphQLError(f'There does not exist a user with the provided user_id.')
        
        auth_user_is_anonymous_guest = auth_user_id == -1

        refreshed_auth_token = None
        expires_timestamp = None
        if not auth_user_is_anonymous_guest:
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


        result_of_checking_if_auth_user_has_access_to_user = check_if_auth_user_has_access_to_user(
            auth_user_id,
            user_id
        )
        if isinstance(result_of_checking_if_auth_user_has_access_to_user, list):
            raise GraphQLError(result_of_checking_if_auth_user_has_access_to_user[0])
        
        elif isinstance(result_of_checking_if_auth_user_has_access_to_user, str):
            if result_of_checking_if_auth_user_has_access_to_user == 'Does not follow private user':
                raise GraphQLError('You cannot access the followings of a private-user that you do not follow')
            return []
        

        if following_ids_to_exclude is None:
            following_ids_to_exclude = []
        following_ids_to_exclude = [x for x in following_ids_to_exclude if x > 0]


        try:
            batch_of_followings_of_user = (UserFollowing.objects
                .filter(follower=user_id)
                .exclude(followed__in=following_ids_to_exclude)
                .values_list('followed', flat=True)
                [:10]
            )
            return batch_of_followings_of_user
        except:
            raise GraphQLError(f'There was trouble getting the batch of followings of user {user_id}')
 


    def resolve_get_num_followers_and_num_followings_of_user(root, info, auth_user_id, user_id):
        if auth_user_id < 1 and auth_user_id != -1:
            raise GraphQLError(f'There does not exist a user with the provided auth_user_id. If you are an anonymous-guest,
            set auth_user_id to -1')

        if user_id < 1:
            raise GraphQLError(f'There does not exist a user with the provided user_id.')
        
        auth_user_is_anonymous_guest = auth_user_id == -1

        refreshed_auth_token = None
        expires_timestamp = None
        if not auth_user_is_anonymous_guest:
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
            user_blocking_to_find = UserBlocking.objects.filter(
                Q(blocker=auth_user_id, blocked=user_id) | Q(blocker=user_id, blocked=auth_user_id)
            )

            if (user_blocking_to_find is not None):
                return [-1, -1]
        except:
            raise GraphQLError(f'There was trouble checking whether or not user {user_id} is in your blockings')
                

        num_followers = -1
        try:
            num_followers = (UserFollowing.objects
                .filter(followed=user_id)
                .count()
            )
        except:
            pass

        num_followings = -1
        try:
            num_followings = (UserFollowing.objects
                .filter(follower=user_id)
                .count()
            )
        except:
            pass

        return [num_followers, num_followings]


    def resolve_get_num_followers_and_num_followings_of_multiple_users(root, info, user_ids):
        set_of_user_ids = set(user_ids)

        user_ids_and_their_num_followers = {}
        try:
            user_ids_and_their_num_followers = {
                entry['followed']: entry['num_followers']
                for entry in (
                    UserFollowing.objects
                    .filter(followed__in=set_of_user_ids) 
                    .values('followed')
                    .annotate(num_followers=Count('followed'))
                )
            }
        except:
            pass

        user_ids_and_their_num_followings = {}
        try:
            user_ids_and_their_num_followings = {
                entry['follower']: entry['num_followings']
                for entry in (
                    UserFollowing.objects
                    .filter(follower__in=set_of_user_ids) 
                    .values('follower')
                    .annotate(num_followings=Count('follower'))
                )
            }
        except:
            pass

        num_followers_and_followings_of_each_user_in_order = []
        for i in range(len(user_ids)):
            user_id = user_ids[i]
            num_followers = -1
            num_followings = -1

            if (len(user_ids_and_their_num_followers) > 0):
                num_followers = user_ids_and_their_num_followers.get(user_id, 0)

            if (len(user_ids_and_their_num_followings) > 0):
                num_followings = user_ids_and_their_num_followings.get(user_id, 0)

            num_followers_and_followings_of_each_user_in_order.append([num_followers, num_followings])


        return num_followers_and_followings_of_each_user_in_order


class FollowUser(graphene.Mutation):
    class Arguments:
        auth_user_id = graphene.Int(required=True)
        id_of_user_to_follow = graphene.Int(required=True)

    id_of_new_user_following = graphene.Int()


    def mutate(self, info, auth_user_id, id_of_user_to_follow):
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
        id_of_user_to_toggle_follow = graphene.Int(required=True)

    result_of_toggle_follow = graphene.String()


    def mutate(self, info, auth_user_id, id_of_user_to_toggle_follow):
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
        

        result_of_checking_if_user_exists = check_if_user_exists(auth_user_id, id_of_user_to_toggle_follow)
        if isinstance(result_of_checking_if_user_exists, list):
            raise GraphQLError(result_of_checking_if_user_exists[0])
        elif isinstance(result_of_checking_if_user_exists, bool):
            if not result_of_checking_if_user_exists:
                raise GraphQLError('The user you are trying to follow does not exist')
            
        try:
            user_following_to_delete = UserFollowing.objects.get(
                follower = auth_user_id,
                followed = id_of_user_to_toggle_follow
            )
            user_following_to_delete.delete()
            return ToggleFollowUser(result_of_toggle_follow = 'Unfollowed Successfully')
        except UserFollowing.DoesNotExist:
            result_of_checking_if_user_exists = check_if_user_exists(auth_user_id, id_of_user_to_toggle_follow)
            
            if isinstance(result_of_checking_if_user_exists, list):
                raise GraphQLError(result_of_checking_if_user_exists[0])
            
            elif isinstance(result_of_checking_if_user_exists, bool):
                if not result_of_checking_if_user_exists:
                    raise GraphQLError('The user you are trying to toggle-follow does not exist')
        except:
            raise GraphQLError('There was trouble removing the user-following, if it even exists, from the database')
        

        new_user_following_serializer = UserFollowingSerializer(data={
            'follower': auth_user_id,
            'followed': id_of_user_to_toggle_follow
        })
        if new_user_following_serializer.is_valid():
            try:
                new_user_following = new_user_following_serializer.save()
                return ToggleFollowUser(result_of_toggle_follow = str(new_user_following.id))
            except:
                raise GraphQLError('There was trouble adding the user-following into the database')


class UnfollowUser(graphene.Mutation):
    class Arguments:
        auth_user_id = graphene.Int(required=True)
        id_of_user_to_unfollow = graphene.Int(required=True)

    was_user_following_found = graphene.Boolean()


    def mutate(self, info, auth_user_id, id_of_user_to_unfollow):
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


schema = graphene.Schema(query=Query, mutation=Mutation)


def authenticate_user(request, user_id):
    try:
        auth_token_val = request.COOKIES.get(f'authToken{user_id}')
        refresh_token_val = request.COOKIES.get(f'refreshToken{user_id}')

        auth_token_is_validly_structured = True
        try:
            decoded_token_bytes = base64.b64decode(auth_token_val, validate=True)
            if not decoded_token_bytes or len(decoded_token_bytes) != 100:
                auth_token_is_validly_structured = False
        except:
            auth_token_is_validly_structured = False

        if not auth_token_is_validly_structured:
            return 'The provided authUser token, if any, in your cookies has an invalid structure.'

        try:
            decoded_token_bytes = base64.b64decode(refresh_token_val, validate=True)
            if not decoded_token_bytes or len(decoded_token_bytes) != 100:
                refresh_token_val = ''
        except:
            refresh_token_val = ''

        cookies_text = f'authToken{user_id}={auth_token_val};'
        if refresh_token_val:
            cookies_text += f' refreshToken{user_id}={refresh_token_val};'

        response = requests.get(
            f'http://34.111.89.101/api/Home-Page/expressJSBackend1/authenticateUser/{user_id}',
            headers={'Cookie': cookies_text},
        )

        if not response.ok:
            return False

        set_cookies = response.headers.get('Set-Cookie')
        if set_cookies:
            set_cookies_array = set_cookies if isinstance(set_cookies, list) else [set_cookies]

            for cookie in set_cookies_array:
                cookie_key_and_value = cookie.split(';')[0]
                cookie_parts = cookie_key_and_value.split('=')

                if cookie_parts[0].strip() == f'authToken{user_id}':
                    refreshed_auth_token = cookie_parts[1].strip()

                    for attribute in cookie.split(';'):
                        trimmed_attribute = attribute.strip()
                        if trimmed_attribute.lower().startswith('expires='):
                            expires_value = trimmed_attribute[8:]
                            try:
                                refreshed_auth_token_cookie_expiration = datetime.strptime(
                                    expires_value, '%a, %d-%b-%Y %H:%M:%S GMT'
                                )
                                return [
                                    refreshed_auth_token,
                                    refreshed_auth_token_cookie_expiration.strftime('%Y-%m-%d %H:%M:%S'),
                                ]
                            except:
                                break
                    break

        return True
    except:
        return 'There was trouble connecting to the ExpressJS backend for user authentication'


def check_if_auth_user_has_access_to_user(auth_user_id, user_id):
    try:
        user_blocking_to_find = UserBlocking.objects.filter(
            Q(blocker=auth_user_id, blocked=user_id) | Q(blocker=user_id, blocked=auth_user_id)
        )

        if (user_blocking_to_find is not None):
            return 'In Blocking' 

    except:
        return [
            f'There was trouble checking if user {user_id} is in the blockings of user {auth_user_id}',
            'BAD_GATEWAY'
        ]
    
    #contact laravelBackend1 to check if user has a private-account. if they do, continue with the code below, else return True directly
    
    try:
        user_following_to_find = UserFollowing.objects.get(
            follower = auth_user_id,
            followed = user_id
        )

        if (user_following_to_find is None):
            return 'Does not follow private user' 

    except:
        return [
            f'There was trouble checking if user {auth_user_id} follows private-user {user_id}',
            'BAD_GATEWAY'
        ]
    
    return True


def check_if_user_exists(auth_user_id, user_id):
    url = 'http://34.111.89.101/api/Home-Page/laravelBackend1/graphql'
    
    headers = {
        'Content-Type': 'application/json'
    }
    
    query = '''
    query ($authUserId: Int!, $userIds: [Int!]!) {
        getTheUserIdsThatExistInList(authUserId: $authUserId, userIds: $userIds)
    }
    '''
    
    variables = {
        'authUserId': auth_user_id,
        'userIds': [user_id]
    }
    
    try:
        response = requests.post(url, headers=headers, json={'query': query, 'variables': variables})

        if not response.ok:
            return [
                f'The laravelBackend1 server had trouble checking whether or not user {user_id} exists',
                'BAD_GATEWAY'
            ]
        
        response_data = response.json()
        return len(response_data['data']['getTheUserIdsThatExistInList']) == 1
    except:
        return [
            f'There was trouble connecting to the laravelBackend1 server to check whether or not user {id} exists',
            'BAD_GATEWAY'
        ]
