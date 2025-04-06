import requests 


class UserConvoAndMessageInfoFetchingService:


    def __init__(self):
        pass


    def get_accepted_convo_ids_of_user(user_id):
        try:
            response = requests.get(
                f'http://34.111.89.101/api/Home-Page/springBootBackend2/getAcceptedConvoIdsOfUser/{user_id}'
            )

            if not response.ok:
                return [
                    f'The springBootBackend2 server had trouble getting the accepted convo-ids of user {user_id}',
                    'BAD_GATEWAY'
                ]

            convo_ids_of_user = response.json()
            return convo_ids_of_user
        except:
            return [
                f'There was trouble connecting to the springBootBackend2 server to get the accepted convo-ids of user {user_id}',
                'BAD_GATEWAY'
            ]
    

    def get_accepted_convo_ids_of_multiple_users(user_ids):
        try:
            response = requests.post(
                f'http://34.111.89.101/api/Home-Page/springBootBackend2/getAcceptedConvoIdsOfMultipleUsers',
                json = {
                    'userIds': user_ids
                }
            )

            if not response.ok:
                return [
                    'The springBootBackend2 server had trouble getting the accepted convo-ids of the users in the provided list',
                    'BAD_GATEWAY'
                ]

            users_and_their_accepted_convo_ids = response.json()
            return users_and_their_accepted_convo_ids
        except:
            return [
                f'There was trouble connecting to the springBootBackend2 server to get the accepted convo-ids of the users in the 
                provided list',
                'BAD_GATEWAY'
            ]
        

    def fetch_new_messages_of_list_of_convos(datetime_to_fetch_new_messages, convo_ids):
        try:
            response = requests.post(
                f'http://34.111.89.101/api/Home-Page/springBootBackend2/getNewMessagesOfListOfConvos',
                headers = {
                    'Content-Type': 'application/json'
                },
                json = {
                    'datetimeToFetchNewMessages': datetime_to_fetch_new_messages,
                    'convoIds': convo_ids
                }
            )

            if not response.ok:
                return [
                    'The springBootBackend2 server had trouble getting the new messages of the convos in the provided list',
                    'BAD_GATEWAY'
                ]

            new_messages_of_list_of_convos = response.json()
            return new_messages_of_list_of_convos
        except:
            return [
                f'There was trouble connecting to the springBootBackend2 server to get the new messages of the convos in the
                provided list',
                'BAD_GATEWAY'
            ]
    

    def check_if_user_has_access_to_convo(user_id, convo_id):
        try:
            response = requests.get(
                f'http://34.111.89.101/api/Home-Page/springBootBackend2/checkIfUserHasAccessToConvo/{user_id}/{convo_id}'
            )

            if not response.ok:
                return [
                    f'The springBootBackend2 server had trouble checking if user {user_id} has access to convo {convo_id}',
                    'BAD_GATEWAY'
                ]

            user_has_access_to_convo = response.json()
            return user_has_access_to_convo
        except:
            return [
                f'There was trouble connecting to the springBootBackend2 server to check if user {user_id} has access to convo
                {convo_id}',
                'BAD_GATEWAY'
            ]
    

    def get_ordered_messages_of_multiple_convos(convo_ids):
        try:
            response = requests.post(
                f'http://34.111.89.101/api/Home-Page/springBootBackend2/getOrderedMessagesOfMultipleConvos',
                headers = {
                    'Content-Type': 'application/json'
                },
                json={
                    'convo_ids': convo_ids
                }
            )

            if not response.ok:
                return [
                    'The springBootBackend2 server had trouble getting the ordered messages of the convos in the provided list',
                    'BAD_GATEWAY'
                ]

            convo_ids_and_their_ordered_messages = response.json()
            return convo_ids_and_their_ordered_messages
        except:
            return [
                f'There was trouble connecting to the springBootBackend2 server to get the ordered messages of the convos in
                the provided list',
                'BAD_GATEWAY'
            ]
