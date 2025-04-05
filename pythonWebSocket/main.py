from .services import UserAuthService, UserConvoAndMessageInfoFetchingService

import asyncio
import websockets
import threading
from datetime import datetime


users_and_the_set_of_clients_subscribed_to_their_updates = {}
users_and_their_accepted_convo_ids = {}

set_of_clients = set()
set_of_user_ids = set()
set_of_accepted_convo_ids = set()

datetime_to_fetch_new_messages = None
timer_for_fetching_new_messages = None
timer_for_fetching_updated_accepted_convo_ids_of_users = None

user_auth_service = UserAuthService()
user_convo_and_message_info_fetching_service = UserConvoAndMessageInfoFetchingService()


async def on_connection(connection, path):
    headers = connection.request_headers

    user_id = None
    clean_path = path.strip('/')

    try:
        user_id = int(clean_path)
        if user_id < 1:
            user_id = None
    except ValueError:
        pass

    if user_id is None:
        await connection.close(code=4400, reason='You did not provide a valid userId')
        return

    cookie_header = headers.get('Cookie')
    cookies = {}
    if cookie_header:
        cookie_parts = cookie_header.split(';')
        for part in cookie_parts:
            if '=' in part:
                k, v = part.strip().split('=', 1)
                cookies[k] = v
    

    user_authentication_result = user_auth_service.authenticate_user(cookies, user_id)

    if isinstance(user_authentication_result, bool):
        if not user_authentication_result:
            await connection.close(code=4403, reason=
                f'The expressJSBackend1 server could not verify you as having the proper credentials to be logged in as
                user {user_id}'
            )
            return
    elif isinstance(user_authentication_result, str):
        if user_authentication_result == 'The provided authUser token, if any, in your cookies has an invalid structure.':
            await connection.close(code=4403, reason=user_authentication_result)
            return
        await connection.close(code=5502, reason=user_authentication_result)
        return


    num_accepted_convos_of_user = 0

    if user_id not in set_of_user_ids:
        set_of_user_ids.add(user_id)
        users_and_the_set_of_clients_subscribed_to_their_updates[user_id] = set()
        result_of_getting_accepted_convo_ids_of_user = user_convo_and_message_info_fetching_service.get_accepted_convo_ids_of_user(
            user_id
        )
        if isinstance(result_of_getting_accepted_convo_ids_of_user, list):
            await connection.send(
                {
                    'event': 'AcceptedConvoIdFetchingError',
                    'data': result_of_getting_accepted_convo_ids_of_user[0]
                }
            )
        else:
            users_and_their_accepted_convo_ids[user_id] = result_of_getting_accepted_convo_ids_of_user
            num_accepted_convos_of_user = len(result_of_getting_accepted_convo_ids_of_user)
            for accepted_convo_id in result_of_getting_accepted_convo_ids_of_user:
                set_of_accepted_convo_ids.add(accepted_convo_id)

    
    users_and_the_set_of_clients_subscribed_to_their_updates[user_id].add(connection)
    set_of_clients.add(connection)

    if timer_for_fetching_updated_accepted_convo_ids_of_users is None:
        timer_for_fetching_updated_accepted_convo_ids_of_users = threading.Timer(5, fetch_updated_accepted_convo_ids_of_users)
        timer_for_fetching_updated_accepted_convo_ids_of_users.start()

    if timer_for_fetching_new_messages is None and num_accepted_convos_of_user > 0:
        datetime_to_fetch_new_messages = datetime.datetime.now() 
        timer_for_fetching_new_messages = threading.Timer(5, fetch_new_messages_and_notify_clients_of_them)
        timer_for_fetching_new_messages.start()

    try:
        async for _ in connection:
            pass
    finally:
        users_and_the_set_of_clients_subscribed_to_their_updates[user_id].remove(connection)
        set_of_clients.remove(connection)

        if len(users_and_the_set_of_clients_subscribed_to_their_updates[user_id]) == 0:
            set_of_user_ids.remove(user_id)

            if len(set_of_user_ids) == 0:
                timer_for_fetching_updated_accepted_convo_ids_of_users.cancel()
                timer_for_fetching_updated_accepted_convo_ids_of_users = None

            accepted_convo_ids_to_delete = set(users_and_their_accepted_convo_ids[user_id])
            del users_and_their_accepted_convo_ids[user_id]
            
            for user_id in users_and_their_accepted_convo_ids:
                for accepted_convo_id in users_and_their_accepted_convo_ids[user_id]:
                    accepted_convo_ids_to_delete.remove(accepted_convo_id)

            for accepted_convo_id in accepted_convo_ids_to_delete:
                set_of_accepted_convo_ids.remove(accepted_convo_id)

            if len(set_of_accepted_convo_ids) == 0:
                datetime_to_fetch_new_messages = None
                timer_for_fetching_new_messages.cancel()
                timer_for_fetching_new_messages = None
            
            del users_and_the_set_of_clients_subscribed_to_their_updates[user_id]
        


async def fetch_updated_accepted_convo_ids_of_users():
    result_of_getting_accepted_convo_ids_of_users = (user_convo_and_message_info_fetching_service
        .get_accepted_convo_ids_of_multiple_users(
            set_of_user_ids
        )
    )
    if isinstance(result_of_getting_accepted_convo_ids_of_users, list):
        await asyncio.wait(
            client.send(
                {
                    'event': 'AcceptedConvoIdFetchingError',
                    'data': result_of_getting_accepted_convo_ids_of_users[0] + f' of users whose accepted convo-ids are
                    being tracked in this websocket'
                }
            )
            for client in set_of_clients
        )
    else:
        users_and_their_accepted_convo_ids = result_of_getting_accepted_convo_ids_of_users
        set_of_accepted_convo_ids = set()
        for user_id in users_and_their_accepted_convo_ids:
            for accepted_convo_id in users_and_their_accepted_convo_ids[user_id]:
                set_of_accepted_convo_ids.add(accepted_convo_id)
            
    
    timer_for_fetching_updated_accepted_convo_ids_of_users = threading.Timer(5, fetch_updated_accepted_convo_ids_of_users)
    timer_for_fetching_updated_accepted_convo_ids_of_users.start()


async def fetch_new_messages_and_notify_clients_of_them():
    result_of_fetching_new_messages_of_list_of_convos = (user_convo_and_message_info_fetching_service
        .fetch_new_messages_of_list_of_convos(
            datetime_to_fetch_new_messages,
            [accepted_convo_id for accepted_convo_id in set_of_accepted_convo_ids]
        )
    )
    datetime_to_fetch_new_messages = datetime.datetime.now()
    if(len(result_of_fetching_new_messages_of_list_of_convos) == 2 and result_of_fetching_new_messages_of_list_of_convos[1] ==
    'BAD_GATEWAY'):
        await asyncio.wait(
            client.send(
                {
                    'event': 'NewMessageFetchingError',
                    'data': result_of_fetching_new_messages_of_list_of_convos[0] + f' of all the convo-ids that are being tracked
                    in this websocket'
                }
            )
            for client in set_of_clients
        )
    else:
        convo_ids_and_their_new_messages = {}
        for new_message in result_of_fetching_new_messages_of_list_of_convos:
            convo_id = new_message['convo_id']

            if convo_id not in convo_ids_and_their_new_messages:
                convo_ids_and_their_new_messages[convo_id] = []

            convo_ids_and_their_new_messages[convo_id].append(new_message)
        
        for user_id in users_and_the_set_of_clients_subscribed_to_their_updates:
            clients_subscribed_to_new_message_updates_of_this_user = users_and_the_set_of_clients_subscribed_to_their_updates[
                user_id
            ]
            new_messages_for_user = []

            for accepted_convo_id in users_and_their_accepted_convo_ids[user_id]:
                if accepted_convo_id in convo_ids_and_their_new_messages:
                    for new_message in convo_ids_and_their_new_messages[accepted_convo_id]:
                        new_messages_for_user.append(new_message)
            
            for client in clients_subscribed_to_new_message_updates_of_this_user:
                await client.send({
                    'event': 'NewMessages',
                    'data': new_messages_for_user
                })


    timer_for_fetching_new_messages = threading.Timer(5, fetch_new_messages_and_notify_clients_of_them)
    timer_for_fetching_new_messages.start()



websocket_server = websockets.serve(on_connection, 'localhost', 8012)
asyncio.get_event_loop().run_until_complete(websocket_server)
asyncio.get_event_loop().run_forever()
