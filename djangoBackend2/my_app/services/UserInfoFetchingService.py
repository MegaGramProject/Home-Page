from ..models import UserBlocking, UserFollowing 

import requests

from django.db.models import Q


def check_if_user_exists(auth_user_id, user_id):
    url = 'http://34.111.89.101/api/Home-Page/laravelBackend1/graphql'
    
    headers = {
        'Content-Type': 'application/json'
    }
    
    query = '''query ($authUserId: Int!, $userIds: [Int!]!) {
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
            f'There was trouble connecting to the laravelBackend1 server to check whether or not user {user_id} exists',
            'BAD_GATEWAY'
        ]


def check_if_user_exists_and_is_private(auth_user_id, user_id):
    url = 'http://34.111.89.101/api/Home-Page/laravelBackend1/graphql'
    
    headers = {
        'Content-Type': 'application/json'
    }
    
    query = '''query ($authUserId: Int!, $userIds: [Int!]!) {
        getIsPrivateStatusesOfList(authUserId: $authUserId, userIds: $userIds)
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
                f'The laravelBackend1 server had trouble checking whether or not user {user_id} is private,
                if it even exists',
                'BAD_GATEWAY'
            ]
        
        response_data = response.json()
        
        if len(response_data['data']['getIsPrivateStatusesOfList']) == 0:
            return 'does not exist'
        
        if response_data['data']['getIsPrivateStatusesOfList'][0] == 1:
            return 'private'
        return 'public'
    except:
        return [
            f'There was trouble connecting to the laravelBackend1 server to check whether or not user {user_id} is private,
            if it even exists',
            'BAD_GATEWAY'
        ]


def check_if_auth_user_has_access_to_user(auth_user_id, user_id):
    url = 'http://34.111.89.101/api/Home-Page/laravelBackend1/graphql'
    
    headers = {
        'Content-Type': 'application/json'
    }
    
    query = '''query ($authUserId: Int!, $userIds: [Int!]!) {
        getIsPrivateStatusesOfList(authUserId: $authUserId, userIds: $userIds)
    }
    '''
    
    variables = {
        'authUserId': auth_user_id,
        'userIds': [user_id]
    }

    user_is_private = False
    
    try:
        response = requests.post(url, headers=headers, json={'query': query, 'variables': variables})

        if not response.ok:
            return [
                f'The laravelBackend1 server had trouble checking whether or not user {user_id} is private,
                if it even exists',
                'BAD_GATEWAY'
            ]
        
        response_data = response.json()
        if len(response_data['data']['getIsPrivateStatusesOfList']) != 1:
            return 'User does not exist or is in blockings'
        
        user_is_private = response_data['data']['getIsPrivateStatusesOfList'][0] == 1
    except:
        return [
            f'There was trouble connecting to the laravelBackend1 server to check whether or not user {user_id} is private,
            if it even exists',
            'BAD_GATEWAY'
        ]
    

    if user_is_private:
        try:
            if not UserFollowing.objects.filter(follower=auth_user_id, followed=user_id).exists():
                return 'Does not follow private user'
        except:
            return [
                f'There was trouble checking whether or not user {auth_user_id} follows private user {user_id}',
                'BAD_GATEWAY'
            ] 
    
    return True
