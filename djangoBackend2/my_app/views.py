from .models import PostSave, UserBlocking, UserFollowing
from .serializers import PostSaveSerializer, UserBlockingSerializer
from .services import authenticate_user, check_if_auth_user_has_access_to_post, check_if_user_exists, check_if_auth_user_is_an_author_of_post, get_usernames_of_multiple_user_ids

from rest_framework.decorators import api_view
from rest_framework.response import Response

from bson.objectid import ObjectId

from django.db.utils import IntegrityError 
from django.db.models import Count, Q, Case, When, F

from datetime import datetime
import re


stringLabelToIntStatusCodeMappings = {
    'UNAUTHORIZED': 403,
    'BAD_GATEWAY': 502,
    'NOT_FOUND': 404,
    'INTERNAL_SERVER_ERROR': 500
};


@api_view(['POST'])
def get_batch_of_savers_of_own_post(request, auth_user_id, overall_post_id):
    if auth_user_id < 1:
          return Response('There does not exist a user with the provided auth_user_id', status=400)
    try:
        ObjectId(overall_post_id)
    except:
        return Response('The provided overall_post_id is invalid', status=400)

    user_authentication_result = authenticate_user(request, auth_user_id)
    refreshed_auth_token = None
    expires_timestamp = None

    if isinstance(user_authentication_result, bool):
        if not user_authentication_result:
            return Response(
                f'''
                The expressJSBackend1 server could not verify you as having the proper credentials
                to be logged in as {auth_user_id}
                ''', 
                status=403
            )
    elif isinstance(user_authentication_result, str):
        if user_authentication_result == 'The provided authUser token, if any, in your cookies has an invalid structure.':
            return Response(user_authentication_result, status=403)
        return Response(user_authentication_result, status=502)
    else:
        refreshed_auth_token, expiration_date = user_authentication_result
        expires_timestamp = datetime.datetime.fromtimestamp(expiration_date).strftime('%a, %d-%b-%Y %H:%M:%S GMT')


    result_of_checking_if_auth_user_is_author_of_post = check_if_auth_user_is_an_author_of_post(
        auth_user_id,
        overall_post_id
    )
    if isinstance(result_of_checking_if_auth_user_is_author_of_post, list):
        return Response(
            result_of_checking_if_auth_user_is_author_of_post[0],
            status=stringLabelToIntStatusCodeMappings[result_of_checking_if_auth_user_is_author_of_post[1]]
        )
    elif isinstance(result_of_checking_if_auth_user_is_author_of_post, bool):
        if not result_of_checking_if_auth_user_is_author_of_post:
            return Response(
                'You cannot get savers of a post that you are not an author of',
                status=403
            )

    saver_ids_to_exclude = request.data.get('saverIdsToExclude', [])
    saver_ids_to_exclude = [x for x in saver_ids_to_exclude if x > 0]
    set_of_saver_ids_to_exclude = set(saver_ids_to_exclude)
    error_message = ''
    response = None

    try:
        batch_of_savers_of_post = (PostSave.objects
            .filter(overall_post_id=overall_post_id)
            .exclude(saver_id__in=set_of_saver_ids_to_exclude)
            .values_list('saver_id', flat=True)
            [:10]
        )
        serialized_batch_of_savers_of_post = PostSaveSerializer(batch_of_savers_of_post, many=True) 
        response = Response(serialized_batch_of_savers_of_post.data)
    except:
        error_message += '• There was trouble fetching the batch of savers of the post\n'
        response = Response(error_message, status=502)
    

    if refreshed_auth_token is not None:
        response.set_cookie(
            f'authToken{auth_user_id}',
            refreshed_auth_token,
            expires=expires_timestamp,
            path='/',
            secure=True,
            httponly=True
        )
    return response


@api_view(['POST'])
def save_post(request, auth_user_id, overall_post_id):
    if auth_user_id < 1:
        return Response('There does not exist a user with the provided auth_user_id', status=400)
    try:
        ObjectId(overall_post_id)
    except:
        return Response('The provided overall_post_id is invalid', status=400)


    user_authentication_result = authenticate_user(request, auth_user_id)
    refreshed_auth_token = None
    expires_timestamp = None

    if isinstance(user_authentication_result, bool):
        if not user_authentication_result:
            return Response(
                f'''
                The expressJSBackend1 server could not verify you as having the proper credentials
                to be logged in as {auth_user_id}
                ''', 
                status=403
            )
    elif isinstance(user_authentication_result, str):
        if user_authentication_result == 'The provided authUser token, if any, in your cookies has an invalid structure.':
            return Response(user_authentication_result, status=403)
        return Response(user_authentication_result, status=502)
    else:
        refreshed_auth_token, expiration_date = user_authentication_result
        expires_timestamp = datetime.datetime.fromtimestamp(expiration_date).strftime('%a, %d-%b-%Y %H:%M:%S GMT')


    result_of_checking_if_auth_user_has_access_to_post = check_if_auth_user_has_access_to_post(
        auth_user_id,
        overall_post_id
    )
    if isinstance(result_of_checking_if_auth_user_has_access_to_post, list):
        return Response(
            result_of_checking_if_auth_user_has_access_to_post[0],
            status=stringLabelToIntStatusCodeMappings[result_of_checking_if_auth_user_has_access_to_post[1]]
        )

    new_post_save_serializer = PostSaveSerializer(data={
        'overall_post_id': overall_post_id,
        'saver_id': auth_user_id
    })
    error_message = ''
    response = None

    if new_post_save_serializer.is_valid():
        try:
            new_post_save = new_post_save_serializer.save()
            response = Response(new_post_save.id, status=201)
        except:
            error_message += '• There was trouble adding your post-save into the database\n'
            response = Response(error_message, status=502)
    
    if refreshed_auth_token is not None:
        response.set_cookie(
            f'authToken{auth_user_id}',
            refreshed_auth_token,
            expires=expires_timestamp,
            path='/',
            secure=True,
            httponly=True
        )
    return response


@api_view(['PUT'])
def toggle_save_post(request, auth_user_id, overall_post_id):
    if auth_user_id < 1:
          return Response('There does not exist a user with the provided auth_user_id', status=400)
    try:
        ObjectId(overall_post_id)
    except:
        return Response('The provided overall_post_id is invalid', status=400)


    user_authentication_result = authenticate_user(request, auth_user_id)
    refreshed_auth_token = None
    expires_timestamp = None

    if isinstance(user_authentication_result, bool):
        if not user_authentication_result:
            return Response(
                f'''
                The expressJSBackend1 server could not verify you as having the proper credentials
                to be logged in as {auth_user_id}
                ''', 
                status=403
            )
    elif isinstance(user_authentication_result, str):
        if user_authentication_result == 'The provided authUser token, if any, in your cookies has an invalid structure.':
            return Response(user_authentication_result, status=403)
        return Response(user_authentication_result, status=502)
    else:
        refreshed_auth_token, expiration_date = user_authentication_result
        expires_timestamp = datetime.datetime.fromtimestamp(expiration_date).strftime('%a, %d-%b-%Y %H:%M:%S GMT')


    result_of_checking_if_auth_user_has_access_to_post = check_if_auth_user_has_access_to_post(
        auth_user_id,
        overall_post_id
    )
    if isinstance(result_of_checking_if_auth_user_has_access_to_post, list):
        return Response(
            result_of_checking_if_auth_user_has_access_to_post[0],
            status=stringLabelToIntStatusCodeMappings[result_of_checking_if_auth_user_has_access_to_post[1]]
        )

    error_message = ''
    new_post_save_serializer = PostSave(data={
        'overall_post_id': overall_post_id,
        'saver_id': auth_user_id
    })
    response = None

    if new_post_save_serializer.is_valid():
        try:
            new_post_save = new_post_save_serializer.save()
            id_of_new_post_save = new_post_save.id
            response = Response({
                'id_of_new_post_save': id_of_new_post_save
            }, status=201)
        except IntegrityError:
            pass #post is already saved; save needs to be removed instead of added
        except:
            error_message += '• There was trouble adding your post-save into the database\n'
            response = Response(error_message, status=502)
    
    if response is None:
        try:
            post_save_to_remove = PostSave.objects.get(
                overall_post_id = overall_post_id,
                saver_id = auth_user_id
            )
            post_save_to_remove.delete()
            response = Response(True)
        except PostSave.DoesNotExist:
            response = Response(False)
        except:
            error_message += '• There was trouble removing your post-save from the database\n'
            response = Response(error_message, status=502)


    if refreshed_auth_token is not None:
        response.set_cookie(
            f'authToken{auth_user_id}',
            refreshed_auth_token,
            expires=expires_timestamp,
            path='/',
            secure=True,
            httponly=True
        )
    return response


@api_view(['DELETE'])
def unsave_post(request, auth_user_id, overall_post_id):
    if auth_user_id < 1:
          return Response('There does not exist a user with the provided auth_user_id', status=400)
    
    try:
        ObjectId(overall_post_id)
    except:
        return Response('The provided overall_post_id is invalid', status=400)


    user_authentication_result = authenticate_user(request, auth_user_id)
    refreshed_auth_token = None
    expires_timestamp = None

    if isinstance(user_authentication_result, bool):
        if not user_authentication_result:
            return Response(
                f'''
                The expressJSBackend1 server could not verify you as having the proper credentials
                to be logged in as {auth_user_id}
                ''', 
                status=403
            )
    elif isinstance(user_authentication_result, str):
        if user_authentication_result == 'The provided authUser token, if any, in your cookies has an invalid structure.':
            return Response(user_authentication_result, status=403)
        return Response(user_authentication_result, status=502)
    else:
        refreshed_auth_token, expiration_date = user_authentication_result
        expires_timestamp = datetime.datetime.fromtimestamp(expiration_date).strftime('%a, %d-%b-%Y %H:%M:%S GMT')


    result_of_checking_if_auth_user_has_access_to_post = check_if_auth_user_has_access_to_post(
        auth_user_id,
        overall_post_id
    )
    if isinstance(result_of_checking_if_auth_user_has_access_to_post, list):
        return Response(
            result_of_checking_if_auth_user_has_access_to_post[0],
            status=stringLabelToIntStatusCodeMappings[result_of_checking_if_auth_user_has_access_to_post[1]]
        )
        
    error_message = ''

    response = None

    try:
        post_save_to_remove = PostSave.objects.get(
            overall_post_id = overall_post_id,
            saver_id = auth_user_id
        )
        post_save_to_remove.delete()
        response = Response(True)
    except PostSave.DoesNotExist:
        response = Response(False)
    except:
        error_message += '• There was trouble removing your post-save from the database\n'
        response = Response(error_message, status=502)


    if refreshed_auth_token is not None:
        response.set_cookie(
            f'authToken{auth_user_id}',
            refreshed_auth_token,
            expires=expires_timestamp,
            path='/',
            secure=True,
            httponly=True
        )
    return response


@api_view(['POST'])
def get_batch_of_those_blocked_by_me(request, auth_user_id):
    if auth_user_id < 1:
        return Response('There does not exist a user with the provided auth_user_id', status=400)
    
    user_authentication_result = authenticate_user(request, auth_user_id)
    refreshed_auth_token = None
    expires_timestamp = None

    if isinstance(user_authentication_result, bool):
        if not user_authentication_result:
            return Response(
                f'''
                The expressJSBackend1 server could not verify you as having the proper credentials
                to be logged in as {auth_user_id}
                ''', 
                status=403
            )
    elif isinstance(user_authentication_result, str):
        if user_authentication_result == 'The provided authUser token, if any, in your cookies has an invalid structure.':
            return Response(user_authentication_result, status=403)
        return Response(user_authentication_result, status=502)
    else:
        refreshed_auth_token, expiration_date = user_authentication_result
        expires_timestamp = datetime.datetime.fromtimestamp(expiration_date).strftime('%a, %d-%b-%Y %H:%M:%S GMT')

    ids_to_exclude = request.data.get('ids_to_exclude', [])
    ids_to_exclude = [x for x in ids_to_exclude if x > 0]
    set_of_ids_to_exclude = set(ids_to_exclude)
    error_message = ''
    response = None

    try:
        batch_of_those_blocked_by_me = (UserBlocking.objects
            .filter(blocker=auth_user_id)
            .exclude(blocked__in=set_of_ids_to_exclude)
            .values_list('blocked', flat=True)
            [:10]
        )
        serialized_batch_of_those_blocked_by_me = UserBlockingSerializer(batch_of_those_blocked_by_me, many=True) 
        response = Response(serialized_batch_of_those_blocked_by_me.data)
    except:
        error_message += '• There was trouble fetching the batch of those blocked by you\n'
        response = Response(error_message, status=502)
    

    if refreshed_auth_token is not None:
        response.set_cookie(
            f'authToken{auth_user_id}',
            refreshed_auth_token,
            expires=expires_timestamp,
            path='/',
            secure=True,
            httponly=True
        )
    return response


@api_view(['POST'])
def block_user(request, auth_user_id, id_of_user_to_block):
    if auth_user_id < 1 or id_of_user_to_block < 1:
        return Response('There does not exist a user with the provided auth_user_id and/or id_of_user_to_block', status=400)
    
    user_authentication_result = authenticate_user(request, auth_user_id)
    refreshed_auth_token = None
    expires_timestamp = None

    if isinstance(user_authentication_result, bool):
        if not user_authentication_result:
            return Response(
                f'''
                The expressJSBackend1 server could not verify you as having the proper credentials
                to be logged in as {auth_user_id}
                ''', 
                status=403
            )
    elif isinstance(user_authentication_result, str):
        if user_authentication_result == 'The provided authUser token, if any, in your cookies has an invalid structure.':
            return Response(user_authentication_result, status=403)
        return Response(user_authentication_result, status=502)
    else:
        refreshed_auth_token, expiration_date = user_authentication_result
        expires_timestamp = datetime.datetime.fromtimestamp(expiration_date).strftime('%a, %d-%b-%Y %H:%M:%S GMT')


    result_of_checking_if_user_exists = check_if_user_exists(auth_user_id, id_of_user_to_block)
    if isinstance(result_of_checking_if_user_exists, list):
         return Response(
            result_of_checking_if_user_exists[0],
            status=stringLabelToIntStatusCodeMappings[result_of_checking_if_user_exists[1]]
        )
    elif isinstance(result_of_checking_if_user_exists, bool):
        if not result_of_checking_if_user_exists:
            return Response(
                'The user you are trying to block does not exist',
                status=404
            )


    new_user_blocking_serializer = UserBlockingSerializer(data={
        'blocker': auth_user_id,
        'blocked': id_of_user_to_block
    })
    error_message = ''
    response = None

    if new_user_blocking_serializer.is_valid():
        try:
            new_user_blocking = new_user_blocking_serializer.save()
            response = Response(new_user_blocking.id, status=201)
        except:
            error_message += '• There was trouble adding your blocking into the database\n'
            response = Response(error_message, status=502)
    
    if refreshed_auth_token is not None:
        response.set_cookie(
            f'authToken{auth_user_id}',
            refreshed_auth_token,
            expires=expires_timestamp,
            path='/',
            secure=True,
            httponly=True
        )
    return response


@api_view(['PUT'])
def toggle_block_user(request, auth_user_id, id_of_user_to_toggle_block):
    if auth_user_id < 1 or id_of_user_to_toggle_block < 1:
        return Response('There does not exist a user with the provided auth_user_id and/or id_of_user_to_toggle_block', status=400)
    
    user_authentication_result = authenticate_user(request, auth_user_id)
    refreshed_auth_token = None
    expires_timestamp = None

    if isinstance(user_authentication_result, bool):
        if not user_authentication_result:
            return Response(
                f'''
                The expressJSBackend1 server could not verify you as having the proper credentials
                to be logged in as {auth_user_id}
                ''', 
                status=403
            )
    elif isinstance(user_authentication_result, str):
        if user_authentication_result == 'The provided authUser token, if any, in your cookies has an invalid structure.':
            return Response(user_authentication_result, status=403)
        return Response(user_authentication_result, status=502)
    else:
        refreshed_auth_token, expiration_date = user_authentication_result
        expires_timestamp = datetime.datetime.fromtimestamp(expiration_date).strftime('%a, %d-%b-%Y %H:%M:%S GMT')

    response = None
    error_message = ''

    try:
        user_blocking_to_delete = UserBlocking.objects.get(
            blocker = auth_user_id,
            blocked = id_of_user_to_toggle_block
        )
        user_blocking_to_delete.delete()
        response = Response(True)
    except UserBlocking.DoesNotExist:
        result_of_checking_if_user_exists = check_if_user_exists(auth_user_id, id_of_user_to_toggle_block)
        if isinstance(result_of_checking_if_user_exists, list):
            return Response(
                result_of_checking_if_user_exists[0],
                status=stringLabelToIntStatusCodeMappings[result_of_checking_if_user_exists[1]]
            )
        elif isinstance(result_of_checking_if_user_exists, bool):
            if not result_of_checking_if_user_exists:
                return Response(
                    'The user you are trying to toggle-block does not exist',
                    status=404
                )
    except:
        error_message += '• There was trouble removing the user-blocking, if it even exists, from the database\n'
        response = Response(error_message, status=502)
    

    if response is None:
        new_user_blocking_serializer = UserBlockingSerializer(data={
            'blocker': auth_user_id,
            'blocked': id_of_user_to_toggle_block
        })
        if new_user_blocking_serializer.is_valid():
            try:
                new_user_blocking = new_user_blocking_serializer.save()
                response = Response(new_user_blocking.id, status=201)
            except:
                error_message += '• There was trouble adding your blocking into the database\n'
                response = Response(error_message, status=502)


    if refreshed_auth_token is not None:
        response.set_cookie(
            f'authToken{auth_user_id}',
            refreshed_auth_token,
            expires=expires_timestamp,
            path='/',
            secure=True,
            httponly=True
        )
    return response


@api_view(['DELETE'])
def unblock_user(request, auth_user_id, id_of_user_to_unblock):
    if auth_user_id < 1 or id_of_user_to_unblock < 1:
        return Response('There does not exist a user with the provided auth_user_id and/or id_of_user_to_unblock', status=400)
    
    user_authentication_result = authenticate_user(request, auth_user_id)
    refreshed_auth_token = None
    expires_timestamp = None

    if isinstance(user_authentication_result, bool):
        if not user_authentication_result:
            return Response(
                f'''
                The expressJSBackend1 server could not verify you as having the proper credentials
                to be logged in as {auth_user_id}
                ''', 
                status=403
            )
    elif isinstance(user_authentication_result, str):
        if user_authentication_result == 'The provided authUser token, if any, in your cookies has an invalid structure.':
            return Response(user_authentication_result, status=403)
        return Response(user_authentication_result, status=502)
    else:
        refreshed_auth_token, expiration_date = user_authentication_result
        expires_timestamp = datetime.datetime.fromtimestamp(expiration_date).strftime('%a, %d-%b-%Y %H:%M:%S GMT')
    
    response = None
    error_message = ''

    try:
        user_blocking_to_delete = UserBlocking.objects.get(
            blocker = auth_user_id,
            blocked = id_of_user_to_unblock
        )
        user_blocking_to_delete.delete()
        response = Response(True)
    except UserBlocking.DoesNotExist:
        response = Response(False)
    except:
        error_message += '• There was trouble removing the user-blocking from the database\n'
        response = Response(error_message, status=502)

    if refreshed_auth_token is not None:
        response.set_cookie(
            f'authToken{auth_user_id}',
            refreshed_auth_token,
            expires=expires_timestamp,
            path='/',
            secure=True,
            httponly=True
        )
    return response


@api_view('GET')
def get_blockings_of_user(request, auth_user_id):
    try:
        all_blockings_of_user = (UserBlocking.objects
            .filter(Q(blocker=auth_user_id) | Q(blocked=auth_user_id))
            .annotate(
                other_user=Case(
                    When(blocker=auth_user_id, then=F('blocked')),
                    When(blocked=auth_user_id, then=F('blocker'))
                )
            )
            .values_list('other_user', flat=True)
        )

        return Response(all_blockings_of_user, status=200)
    except:
        return Response(f'There was trouble getting all the blockings of user {auth_user_id}', status=502)


@api_view('POST')
def is_each_user_in_list_in_the_blockings_of_auth_user(request, auth_user_id):
    set_of_user_ids = set(request.data['user_ids'])

    try:
        each_user_in_list_in_the_blockings_of_auth_user = (UserBlocking.objects
            .filter(
                Q(blocker=auth_user_id, blocked__in=set_of_user_ids) | Q(blocker__in=set_of_user_ids, blocked=auth_user_id)
            )
            .count() == len(set_of_user_ids)
        )

        return Response(each_user_in_list_in_the_blockings_of_auth_user, status=200)
    except:
        raise Response(
            f'There was trouble checking whether or not each user in the list is in the blockings of user {auth_user_id}',
            502
        )
    
    
@api_view(['GET'])
def get_followings_and_blockings_of_user(request, auth_user_id):
    error_message = ''

    followings_of_user = []
    try:
        followings_of_user = (UserFollowing.objects
            .filter(follower=auth_user_id)
            .values_list('followed', flat=True)
        )
    except:
        error_message += '• There was trouble getting all the followings of user {auth_user_id}\n'
    

    blockings_of_user = []
    try:
       blockings_of_user = (UserBlocking.objects
            .filter(Q(blocker=auth_user_id) | Q(blocked=auth_user_id))
            .annotate(
                other_user=Case(
                    When(blocker=auth_user_id, then=F('blocked')),
                    When(blocked=auth_user_id, then=F('blocker'))
                )
            )
            .values_list('other_user', flat=True)
        )
    except:
        error_message += '• There was trouble getting all the blockings of user {auth_user_id}\n'
    
    return Response({
        'error_message': error_message,
        'followings': followings_of_user,
        'blockings': blockings_of_user
    }, status=200)


@api_view(['GET'])
def check_if_user_is_in_blockings_of_auth_user(request, auth_user_id, user_id):
    try:
        user_is_in_blockings_of_auth_user = (UserBlocking.objects
            .filter(Q(blocker=auth_user_id, blocked=user_id) | Q(blocker=user_id, blocked=auth_user_id))
            .exists()
        )
       
        return Response(user_is_in_blockings_of_auth_user, status=200)
    except:
        return Response('• There was trouble checking if user {user_id} is in the blockings fo user {auth_user_id}\n', status=502)


@api_view(['POST'])
def check_if_users_in_list_are_in_blockings_of_auth_user(request, auth_user_id):
    set_of_user_ids = set(request.data['user_ids'])

    try:
        user_blockings_of_interest = (UserBlocking.objects
            .filter(
                Q(blocker=auth_user_id, blocked__in=set_of_user_ids) |
                Q(blocker__in=set_of_user_ids, blocked=auth_user_id)
            )
        )

        users_and_if_they_are_in_blockings_of_auth_user = {}

        for user_id in set_of_user_ids:
            users_and_if_they_are_in_blockings_of_auth_user[user_id] = False

        for user_blocking in user_blockings_of_interest:
            if user_blocking.blocker == auth_user_id:
                users_and_if_they_are_in_blockings_of_auth_user[user_blocking.blocked] = True
            else:
                users_and_if_they_are_in_blockings_of_auth_user[user_blocking.blocker] = True
       
        return Response(users_and_if_they_are_in_blockings_of_auth_user, status=200)
    except:
        return Response('There was trouble fetching the user-blockings of interest from the database', status=502)


@api_view(['POST'])
def get_ordered_list_of_user_suggestions_based_on_num_followers_and_other_metrics(request, auth_user_id,
username_starts_with_this, limit):
    if auth_user_id < 1 and auth_user_id != -1:
        return Response(f'There does not exist a user with the provided auth_user_id. If you are an anonymous-guest, you
        must set the auth_user_id to -1', status=400)

    if re.match(r'^[a-z0-9._]{1,30}$', username_starts_with_this) is None:
        return Response('The provided \'username_starts_with_this\' is invalid', status=400)
    
    if limit > 50:
        return Response('The provided limit cannot exceed 50', status=400)
    
    auth_user_is_anonymous_guest = auth_user_id == -1
    if not auth_user_is_anonymous_guest:
        user_authentication_result = authenticate_user(request, auth_user_id)
        refreshed_auth_token = None
        expires_timestamp = None

        if isinstance(user_authentication_result, bool):
            if not user_authentication_result:
                return Response(
                    f'The expressJSBackend1 server could not verify you as having the proper credentials to be logged in as
                    {auth_user_id}', 
                    status=403
                )
        elif isinstance(user_authentication_result, str):
            if user_authentication_result == 'The provided authUser token, if any, in your cookies has an invalid structure.':
                return Response(user_authentication_result, status=403)
            return Response(user_authentication_result, status=502)
        else:
            refreshed_auth_token, expiration_date = user_authentication_result
            expires_timestamp = datetime.datetime.fromtimestamp(expiration_date).strftime('%a, %d-%b-%Y %H:%M:%S GMT')

    user_ids_to_exclude = request.data.get('user_ids_to_exclude', [])
    user_ids_to_exclude = [
        x for x in user_ids_to_exclude if isinstance(x, int) and x > 0
    ]
    set_of_user_ids_to_exclude = set(user_ids_to_exclude)

    auth_user_followings = request.data.get('auth_user_followings', [])
    auth_user_followings = [
        x for x in auth_user_followings if isinstance(x, int) and x > 0 and x not in set_of_user_ids_to_exclude
    ]
    set_of_auth_user_followings = set(auth_user_followings)

    response = None 
    error_message = ''
    set_of_auth_user_blockings = set()
    
    if not auth_user_is_anonymous_guest:
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
                set_of_user_ids_to_exclude.add(auth_user_blocking)
                set_of_auth_user_followings.remove(auth_user_blocking)

        except:
            error_message += '• There was trouble getting the blockings of user ' + auth_user_id + '\n'
            response = Response(error_message, status=502)
            if refreshed_auth_token is not None:
                response.set_cookie(
                    f'authToken{auth_user_id}',
                    refreshed_auth_token,
                    expires=expires_timestamp,
                    path='/',
                    secure=True,
                    httponly=True
                )
                
            return response

    users_and_their_num_followers = {}
    
    try:
        users_and_their_num_followers = {
            entry['followed']: entry['num_followers']
            for entry in (
                UserFollowing.objects
                .exclude(followed__in=set_of_user_ids_to_exclude)
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
                .filter(follower__in=set_of_auth_user_followings) 
                .exclude(followed__in=set_of_user_ids_to_exclude)
                .values('followed')
                .annotate(num_followers_who_are_followed_by_auth_user=Count('followed'))
            )
        }
    except:
        error_message += f'• There was trouble fetching from the database the dict for
        users_and_their_num_followers_who_are_followed_by_auth_user\n'

    all_users_found = set(
        users_and_their_num_followers_who_are_followed_by_auth_user.keys()) | set(users_and_their_num_followers.keys()
    )

    users_found_and_their_usernames = None
    if len(all_users_found) > 0:
        users_found_and_their_usernames = get_usernames_of_multiple_user_ids([user_id for user_id in all_users_found])
       
        if isinstance(users_found_and_their_usernames, list):
            error_message += f'• {users_found_and_their_usernames[0]}\n'
            response = Response(error_message, status=502)
            if refreshed_auth_token is not None:
                response.set_cookie(
                    f'authToken{auth_user_id}',
                    refreshed_auth_token,
                    expires=expires_timestamp,
                    path='/',
                    secure=True,
                    httponly=True
                )
                
            return response

    info_of_each_user_found_of_interest = []

    for user_id in all_users_found:
        username_of_user = users_found_and_their_usernames.get(user_id, None)

        if username_of_user is not None and username_of_user.startswith(username_starts_with_this):
            num_followers_of_user = users_and_their_num_followers.get(user_id, 0)
            num_followers_of_user_who_are_followed_by_auth_user = (users_and_their_num_followers_who_are_followed_by_auth_user
                .get(
                    user_id, 0
                )
            )
            info_of_each_user_found_of_interest.append({
                'user_id': user_id,
                'username': username_of_user,
                'num_followers_of_user': num_followers_of_user,
                'num_followers_of_user_who_are_followed_by_auth_user': num_followers_of_user_who_are_followed_by_auth_user
            })

    info_of_each_user_found_of_interest = sorted(
        info_of_each_user_found_of_interest,
        key=lambda x: (
            x['num_followers_of_user_who_are_followed_by_auth_user'],
            x['num_followers_of_user'],
        ),
        reverse=True
    )

    ordered_list_of_user_ids = []
    ordered_list_of_usernames = []

    for i in range(min(limit, len(info_of_each_user_found_of_interest))):
        ordered_list_of_user_ids.append(info_of_each_user_found_of_interest[i]['user_id'])
        ordered_list_of_usernames.append(info_of_each_user_found_of_interest[i]['username'])

    response = Response({
        'error_message': error_message,
        'ordered_list_of_user_ids': ordered_list_of_user_ids,
        'ordered_list_of_usernames': ordered_list_of_usernames
    }, status=200)

    if refreshed_auth_token is not None:
        response.set_cookie(
            f'authToken{auth_user_id}',
            refreshed_auth_token,
            expires=expires_timestamp,
            path='/',
            secure=True,
            httponly=True
        )
        
    return response