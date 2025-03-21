import requests


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

