from ..models import UserFollowing, UserBlocking

import requests

from django.db.models import Q

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
    set_of_authors_of_post = None
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
        set_of_authors_of_post = set(authors_of_post)
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
            user_follows_at_least_one_post_author = UserFollowing.objects.filter(
                follower=auth_user_id,
                followed__in=set_of_authors_of_post 
            ).exists()


            if not user_follows_at_least_one_post_author:
                return [
                    f'User {auth_user_id} does not follow at-least one of the authors of post {overall_post_id} and hence
                    does not have the authority to access/modify this encrypted post\'s data',
                    'UNAUTHORIZED'
                ]

        except:
            return [
                f'There was trouble connecting checking whether or not user {auth_user_id} follows at-least one of the authors of
                the post',
                'BAD_GATEWAY'
            ]

    else:
        try:
            each_author_of_post_is_in_blockings_of_auth_user = (UserBlocking.objects
                .filter(
                    Q(blocker=auth_user_id, blocked__in=set_of_authors_of_post) |
                    Q(blocker__in=set_of_authors_of_post, blocked=auth_user_id)
                )
                .count()
            ) == len(set_of_authors_of_post)

            if each_author_of_post_is_in_blockings_of_auth_user:
                return [
                    'There doesn\'t currently exist a post with the overallPostId that you provided.',
                    'NOT_FOUND'
                ]

        except:
            return [
                f'There was trouble checking whether or not each of the authors of this unencrypted post either block you or are
                blocked by you.',
                'BAD_GATEWAY'
            ]

    return True

