from ...models import UserFollowing, UserBlocking
from ...services import authenticate_user, check_if_auth_user_has_access_to_user
from .UserFollowingInfoType import UserFollowingInfoType

import graphene
from graphql import GraphQLError

from datetime import datetime

from django.db.models import Count, Q, Case, When, F


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

    get_followings_of_user = graphene.List(
        graphene.Int,
        auth_user_id=graphene.Int(required=True)
    )

    check_if_user_follows_at_least_one_in_list = graphene.Boolean(
        auth_user_id=graphene.Int(required=True),
        user_ids=graphene.List(graphene.Int, required=True)
    )

    get_the_most_followed_users_in_list = graphene.List(
        graphene.Int,
        user_ids=graphene.List(graphene.Int, required=True),
        limit=graphene.Int(required=False)
    )

    fetch_updated_followers_of_multiple_public_users = graphene.List(
        graphene.Field(UserFollowingInfoType),
        datetime_to_check_for_updates=graphene.String(required=True),
        user_ids=graphene.List(graphene.Int, required=True),
    )

    get_ordered_auth_user_followings_based_on_num_followers_and_other_metrics = graphene.List(
        graphene.Int,
        auth_user_id=graphene.Int(required=True),
        auth_user_followings=graphene.List(graphene.Int, required=True),
        limit=graphene.Int(required=False)
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
        set_of_follower_ids_to_exclude = set(follower_ids_to_exclude)

        try:
            batch_of_followers_of_user = (UserFollowing.objects
                .filter(followed=user_id)
                .exclude(follower__in=set_of_follower_ids_to_exclude)
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
        set_of_following_ids_to_exclude = set(following_ids_to_exclude)

        try:
            batch_of_followings_of_user = (UserFollowing.objects
                .filter(follower=user_id)
                .exclude(followed__in=set_of_following_ids_to_exclude)
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
    

    def resolve_get_followings_of_user(root, auth_user_id):
        try:
            all_followings_of_user = (UserFollowing.objects
                .filter(follower=auth_user_id)
                .values_list('followed', flat=True)
            )
            return all_followings_of_user
        except:
            raise GraphQLError(f'There was trouble getting all the followings of user {auth_user_id}')
    

    def resolve_check_if_user_follows_at_least_one_in_list(root, auth_user_id, user_ids):
        set_of_user_ids = set(user_ids)

        try:
            user_follows_at_least_one_in_list = (UserFollowing.objects
                .filter(follower=auth_user_id, followed__in=set_of_user_ids)
                .exists()
            )

            return user_follows_at_least_one_in_list
        except:
            raise GraphQLError(f'There was trouble checking whether or not user {auth_user_id} follows at-least one user
            in the list')
    

    def resolve_get_the_most_followed_users_in_list(root, user_ids, limit):
        set_of_user_ids = set(user_ids)
        if limit is None:
            limit = 10

        try:
            most_followed_users_in_list = (UserFollowing.objects
                .filter(followed__in=set_of_user_ids)
                .values('followed')
                .annotate(num_followers=Count('follower'))
                .order_by('-num_followers')
                .values_list('followed', flat=True)
                [:limit]
            )

            return most_followed_users_in_list
        except:
            raise GraphQLError(f'There was trouble getting the most followed users in the list')
    

    def resolve_fetch_updated_followers_of_multiple_public_users(root, datetime_to_check_for_updates, user_ids):
        datetime_obj = None
        try:
            datetime_obj = datetime.strptime(datetime_to_check_for_updates, '%Y-%m-%d %H:%M:%S')
        except:
            raise GraphQLError("Invalid datetime-string format. Expected '%Y-%m-%d %H:%M:%S'.")
        
        set_of_user_ids = set(user_ids)

        try:
            updated_followers = list(
                UserFollowing.objects.filter(
                    followed__in=set_of_user_ids,
                    datetime_of_user_following__gte=datetime_obj
                ).values('follower', 'followed')
            )
            return updated_followers

        except:
            raise GraphQLError('There was trouble fetching the asked-for data from the database')
    

    def resolve_get_ordered_auth_user_followings_based_on_num_followers_and_other_metrics(root, info, auth_user_id,
    auth_user_followings, limit):
        if auth_user_id < 1 and auth_user_id != -1:
            raise GraphQLError(f'There does not exist a user with the provided auth_user_id. If you are an anonymous-guest,
            set auth_user_id to -1')

        if not limit: 
            limit = 10

        if limit > 50:
            raise GraphQLError('The provided limit cannot exceed 50')

        auth_user_followings = [x for x in auth_user_followings if x > 0]

        if len(auth_user_followings) == 0:
            raise GraphQLError('The provided \'auth_user_followings\' contains no valid users')
        
        set_of_auth_user_followings = set(auth_user_followings)

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
        
        error_message = ''

        try:
            set_of_auth_user_blockings = set(UserBlocking.objects
                .filter(Q(blocker=auth_user_id) | Q(blocked=auth_user_id))
                .annotate(
                    other_user=Case(
                        When(blocker=auth_user_id, then=F('blocked')),
                        When(blocked=auth_user_id, then=F('blocker'))
                    )
                )
                .values_list('other_user', flat=True)
            )

            for auth_user_blocking in set_of_auth_user_blockings:
                set_of_auth_user_followings.remove(auth_user_blocking)

            if len(set_of_auth_user_followings) == 0:
                error_message += '• The provided \'auth_user_followings\' contains no valid users\n'
        except:
            error_message += '• There was trouble fetching the blockings of user ' + auth_user_id + '\n'
            raise GraphQLError(error_message)
        
        users_and_their_num_followers = {}
    
        try:
            users_and_their_num_followers = {
                entry['followed']: entry['num_followers']
                for entry in (
                    UserFollowing.objects
                    .filter(followed__in=set_of_auth_user_followings)
                    .values('followed')
                    .annotate(num_followers=Count('followed'))
                )
            }
        except:
            error_message += '• There was trouble fetching from the database the dict for users_and_their_num_followers\n'

        users_and_their_num_followers_who_are_followed_by_auth_user = {}
    
        try:
            users_and_their_num_followers_who_are_followed_by_auth_user = {
                entry['followed']: entry['num_followers_who_are_followed_by_auth_user']
                for entry in (
                    UserFollowing.objects
                    .filter(followed__in=set_of_auth_user_followings, follower__in=set_of_auth_user_followings) 
                    .values('followed')
                    .annotate(num_followers_who_are_followed_by_auth_user=Count('followed'))
                )
            }
        except:
            error_message += f'• There was trouble fetching from the database the dict for
            users_and_their_num_followers_who_are_followed_by_auth_user\n'

        num_followers_info_of_each_auth_user_following = []

        for user_id in set_of_auth_user_followings:
            num_followers_of_user = users_and_their_num_followers.get(user_id, 0)
            num_followers_of_user_who_are_followed_by_auth_user = (
                users_and_their_num_followers_who_are_followed_by_auth_user.get(user_id, 0)
            )

            num_followers_info_of_each_auth_user_following.append({
                'user_id': user_id,
                'num_followers_of_user': num_followers_of_user,
                'num_followers_of_user_who_are_followed_by_auth_user': num_followers_of_user_who_are_followed_by_auth_user
            })

        
        num_followers_info_of_each_auth_user_following = sorted(
            num_followers_info_of_each_auth_user_following,
            key=lambda x: (
                x['num_followers_of_user_who_are_followed_by_auth_user'],
                x['num_followers_of_user'],
            ),
            reverse=True
        )

        output = []
        for i in range(min(limit, len(num_followers_info_of_each_auth_user_following))):
            output.append(num_followers_info_of_each_auth_user_following[i]['user_id'])

        return output