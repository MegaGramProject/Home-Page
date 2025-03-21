from .models import PostSave, UserBlocking
from .serializers import PostSaveSerializer, UserBlockingSerializer

from rest_framework.decorators import api_view
from rest_framework.response import Response

from django.db.utils import IntegrityError 
from bson.objectid import ObjectId
import base64
import requests
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


#Helper methods start here!
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
    

def check_if_auth_user_is_an_author_of_post(auth_user_id, overall_post_id):
    try:
        response = requests.get(
            f'http://34.111.89.101/api/Home-Page/expressJSBackend1/getAuthorsAndEncryptionStatusOfPost/{overall_post_id}'
        )

        if response.status_code == 404:
            return [
                'There doesn\'t currently exist a post with the overallPostId that you provided.',
                'NOT_FOUND'
            ]

        if not response.ok:
            return [
                'The expressJSBackend1 server had trouble getting the authors of the post.',
                'BAD_GATEWAY'
            ]

        response_data = response.json()
        authors_of_post = response_data.get('authorsOfPost')

        return auth_user_id in authors_of_post
    
    except:
        return [
            'There was trouble connecting to the expressJSBackend1 server to get the authors of the post.',
            'BAD_GATEWAY'
        ]


def check_if_auth_user_has_access_to_post(auth_user_id, overall_post_id):
    authors_of_post = []
    is_encrypted = False

    try:
        response = requests.get(
            f'http://34.111.89.101/api/Home-Page/expressJSBackend1/getAuthorsAndEncryptionStatusOfPost/{overall_post_id}'
        )

        if response.status_code == 404:
            return [
                'There doesn\'t currently exist a post with the overallPostId that you provided.',
                'NOT_FOUND'
            ]

        if not response.ok:
            return [
                'The expressJSBackend1 server had trouble getting the authors of the post.',
                'BAD_GATEWAY'
            ]

        response_data = response.json()
        authors_of_post = response_data.get('authorsOfPost')
        is_encrypted = response_data.get('isEncrypted')

        if auth_user_id in authors_of_post:
            return True

    except:
        return [
            'There was trouble connecting to the expressJSBackend1 server to get the authors of the post.',
            'BAD_GATEWAY'
        ]

    if is_encrypted:
        try:
            response1 = requests.post(
                f'http://34.111.89.101/api/Home-Page/djangoBackend2/checkIfUserFollowsAtLeastOneInList/{auth_user_id}'
            )

            if not response1.ok:
                return [
                    f'The djangoBackend2 server had trouble verifying whether or not you follow at least one of the authors of this
                    private post.',
                    'BAD_GATEWAY'
                ]

            user_follows_at_least_one_author = response1.json()

            if not user_follows_at_least_one_author:
                return [
                    f'You do not have access to any of the encrypted data of this post since you do not follow at least one of its
                    authors.',
                    'UNAUTHORIZED'
                ]

        except:
            return [
                f'There was trouble connecting to the djangoBackend2 server to verify whether or not you follow at least one of the
                authors of this private post.',
                'BAD_GATEWAY'
            ]

    else:
        try:
            response2 = requests.post(
                f'http://34.111.89.101/api/Home-Page/djangoBackend2/isEachUserInListInTheBlockingsOfAuthUser/{auth_user_id}',
                json={'listOfUsers': authors_of_post},
                headers={'Content-Type': 'application/json'},
            )

            if not response2.ok:
                return [
                    f'The djangoBackend2 server had trouble checking whether or not each of the authors of this post either block
                    you or are blocked by you.',
                    'BAD_GATEWAY'
                ]

            each_post_author_is_in_auth_user_blockings = response2.json()
            if each_post_author_is_in_auth_user_blockings:
                return [
                    'You are trying to access/modify the data of a post that does not exist.',
                    'NOT_FOUND'
                ]

        except:
            return [
                f'There was trouble connecting to the djangoBackend2 server to check whether or not each of the authors of this
                unencrypted post either block you or are blocked by you.',
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
