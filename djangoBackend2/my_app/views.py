from .models import PostSave, UserBlocking, UserFollowing
from .serializers import PostSaveSerializer, UserBlockingSerializer
from .services import authenticate_user, check_if_auth_user_has_access_to_post, check_if_user_exists, check_if_auth_user_is_an_author_of_post

from rest_framework.decorators import api_view
from rest_framework.response import Response

from bson.objectid import ObjectId

from django.db.utils import IntegrityError 
from django.db.models import Q, Case, When, F

from datetime import datetime


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
def remove_save_from_post(request, auth_user_id, overall_post_id):
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
    