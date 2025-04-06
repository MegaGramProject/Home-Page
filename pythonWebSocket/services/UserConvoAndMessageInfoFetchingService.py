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

            accepted_convo_ids_of_user = response.json()
            accepted_convo_ids_of_user = accepted_convo_ids_of_user['acceptedConvoIdsOfUser']
            return accepted_convo_ids_of_user
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
            users_and_their_accepted_convo_ids = users_and_their_accepted_convo_ids['usersAndTheirAcceptedConvoIds']
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
                f'http://34.111.89.101/api/Home-Page/springBootBackend2/getOrderedNewMessagesOfListOfConvos',
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

            ordered_new_messages_of_list_of_convos = response.json()
            ordered_new_messages_of_list_of_convos = ordered_new_messages_of_list_of_convos['orderedNewMessagesOfListOfConvos']
            return ordered_new_messages_of_list_of_convos
        except:
            return [
                f'There was trouble connecting to the springBootBackend2 server to get the new messages of the convos in the
                provided list',
                'BAD_GATEWAY'
            ]
    

    def check_if_user_has_access_to_convo(user_id, convo_id):
        try:
            response = requests.get(
                f'http://34.111.89.101/api/Home-Page/springBootBackend2/getStatusOfUserInConvo/{user_id}/{convo_id}'
            )

            if not response.ok:
                return [
                    f'The springBootBackend2 server had trouble checking if user {user_id} has access to convo {convo_id}',
                    'BAD_GATEWAY'
                ]

            users_status_in_convo = response.json()
            users_status_in_convo = users_status_in_convo['usersStatusInConvo']
            return users_status_in_convo != 'not a member'
        except:
            return [
                f'There was trouble connecting to the springBootBackend2 server to check if user {user_id} has access to convo
                {convo_id}',
                'BAD_GATEWAY'
            ]
    

    def get_ordered_upto_date_messages_of_convos(convo_ids):
        try:
            response = requests.post(
                f'http://34.111.89.101/api/Home-Page/springBootBackend2/getOrderedUptoDateMessagesOfMultipleConvos',
                headers = {
                    'Content-Type': 'application/json'
                },
                json={
                    'convoIds': convo_ids
                }
            )

            if not response.ok:
                return [
                    f'The springBootBackend2 server had trouble getting the ordered upto-date messages of the convos in the
                    provided list',
                    'BAD_GATEWAY'
                ]

            convo_ids_and_their_ordered_upto_date_messages = response.json()
            convo_ids_and_their_ordered_upto_date_messages = convo_ids_and_their_ordered_upto_date_messages[
                'convosAndTheirOrderedUptoDateMessages'
            ]
            return convo_ids_and_their_ordered_upto_date_messages
        except:
            return [
                f'There was trouble connecting to the springBootBackend2 server to get the ordered upto-date messages of the
                convos in the provided list',
                'BAD_GATEWAY'
            ]
