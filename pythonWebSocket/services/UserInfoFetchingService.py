import requests


def get_username_of_user(user_id):
    try:
        url = 'http://34.111.89.101/api/Home-Page/laravelBackend1/graphql'
        headers = {
            'Content-Type': 'application/json',
        }
        payload = {
            'query': '''
                query ($userId: Int!) {
                    getUsernameOfUserIdFromWebSocket(userId: $userId)
                }
            ''',
            'variables': {
                'userId': user_id
            }
        }

        response = requests.post(url, json=payload, headers=headers)

        if not response.ok:
            return f"user {user_id}"

        parsed_response_data = response.json()
        username_of_user = parsed_response_data['data']['getUsernameOfUserIdFromWebSocket']
        return username_of_user

    except Exception:
        return f"user {user_id}"
