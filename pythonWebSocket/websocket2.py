'''
    This websocket-server is used for getting the updated messages of a specific convo(i.e all the messages of a convo upto a
    specified datetime)
'''
from .services import UserAuthService, UserConvoAndMessageInfoFetchingService

import asyncio
import websockets
import threading
from datetime import datetime
import json


convo_ids_and_the_set_of_clients_subscribed_to_their_updates = {}
clients_and_their_datetimes_of_oldest_tracked_messages = {}
convo_ids_and_their_messages = {}
convo_ids_and_the_datetimes_of_their_oldest_tracked_messages = {}

set_of_convo_ids = set()
set_of_clients = set()

timer_for_fetching_updated_messages_of_convos = None

user_auth_service = UserAuthService()
user_convo_and_message_info_fetching_service = UserConvoAndMessageInfoFetchingService()


async def on_connection(connection, path):
    headers = connection.request_headers

    user_id = None
    convo_id = None

    parts_of_path = path[1:].split('/')

    try:
        user_id = int(parts_of_path[0])
        if user_id < 1:
            user_id = None
        
        convo_id = int(parts_of_path[1])
        if convo_id < 1:
            convo_id = None
    except:
        pass

    if user_id is None:
        await connection.close(code=4400, reason='You did not provide a valid userId and/or a valid convoId')
        return
    
    datetime_of_oldest_tracked_message_of_convo = None

    try:
        datetime_of_oldest_tracked_message_of_convo = datetime.strptime(
            headers.get('datetime_of_oldest_tracked_message_of_convo'),
            '%Y-%m-%d %H:%M:%S'
        )
    except:
        datetime_of_oldest_tracked_message_of_convo = 'oldest'

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
    
    result_of_checking_if_user_has_access_to_convo = (user_convo_and_message_info_fetching_service
    .check_if_user_has_access_to_convo(
        user_id, convo_id
    ))
    if isinstance(result_of_checking_if_user_has_access_to_convo, list):
        await connection.close(code=5502, reason=result_of_checking_if_user_has_access_to_convo[0])
        return
    if not result_of_checking_if_user_has_access_to_convo:
        await connection.close(code=4403, reason=f'You do not have access to convo {convo_id}')
        return
    
    add_subscriber_to_convo_messages(connection, convo_id, datetime_of_oldest_tracked_message_of_convo)
    set_of_clients.add(connection)

    if timer_for_fetching_updated_messages_of_convos is None:
        timer_for_fetching_updated_messages_of_convos = threading.Timer(
            5, fetch_updated_messages_of_convos_and_notify_clients_of_them
        )
        timer_for_fetching_updated_messages_of_convos.start()

    try:
        async for message in connection:
            message = json.loads(message)
            if 'event' not in message or 'data' not in message:
                await connection.send(
                    {
                        'event': 'BadRequestError',
                        'data': 'You must provide values for "event" and "data" in order for your message to be taken seriously'
                    }
                )
                break
            event = message['event']
            data = message['data']

            if event == 'ChangeConvoId':
                new_convo_id = None
                if isinstance(data, dict) and isinstance(data.get('convo_id'), int) and data['convo_id'] > 0:
                    new_convo_id = data
                else:
                    await connection.send(
                        {
                            'event': 'BadRequestError',
                            'data': 'Your provided convo-id is invalid'
                        }
                    )
                    break

                new_datetime_of_oldest_tracked_message = None

                try:
                    new_datetime_of_oldest_tracked_message = datetime.strptime(
                        data.get('datetime_of_oldest_tracked_message_of_convo'),
                        '%Y-%m-%d %H:%M:%S'
                    )
                except:
                    new_datetime_of_oldest_tracked_message = 'oldest'
                
                result_of_checking_if_user_has_access_to_convo = (user_convo_and_message_info_fetching_service
                .check_if_user_has_access_to_convo(
                    user_id, new_convo_id
                ))
                if isinstance(result_of_checking_if_user_has_access_to_convo, list):
                    await connection.close(code=5502, reason=result_of_checking_if_user_has_access_to_convo[0])
                    return
                if not result_of_checking_if_user_has_access_to_convo:
                    await connection.close(code=4403, reason=f'You do not have access to convo {new_convo_id}')
                    return
                
                remove_subscriber_of_convo_messages(connection, convo_id)
                convo_id = new_convo_id
                add_subscriber_to_convo_messages(connection, convo_id, new_datetime_of_oldest_tracked_message)
                
    finally:
        set_of_clients.remove(connection)
        remove_subscriber_of_convo_messages(connection, convo_id)
        
        if len(set_of_clients) == 0:
            timer_for_fetching_updated_messages_of_convos.cancel()
            timer_for_fetching_updated_messages_of_convos = None


async def fetch_updated_messages_of_convos_and_notify_clients_of_them():
    convo_ids_and_their_updated_messages = (user_convo_and_message_info_fetching_service
        .get_ordered_messages_of_multiple_convos(
            [convo_id for convo_id in set_of_convo_ids]
        )
    )
    if isinstance(convo_ids_and_their_updated_messages, list):
        for client in set_of_clients:
            await client.send(
            {
                'event': 'ConvoMessagesFetchingError',
                'data': convo_ids_and_their_updated_messages[0] + f' of convos whose messages are being tracked by this
                websocket-server'
            }
        )
        return
    
    for convo_id in convo_ids_and_their_updated_messages:
        updated_messages_of_convo = convo_ids_and_their_updated_messages[convo_id]
        datetime_of_oldest_tracked_message = convo_ids_and_the_datetimes_of_their_oldest_tracked_messages[convo_id]
        if datetime_of_oldest_tracked_message != 'oldest':
            updated_messages_of_convo = [
                updated_message for updated_message in updated_messages_of_convo
                if updated_message['sentAt'] >= datetime_of_oldest_tracked_message
            ]
        convo_ids_and_their_messages[convo_id] = updated_messages_of_convo

        for client in convo_ids_and_the_set_of_clients_subscribed_to_their_updates[convo_id]:
            await client.send(
                {
                    'event': 'UpdatedConvoMessages',
                    'data': updated_messages_of_convo
                }
            )
    
    timer_for_fetching_updated_messages_of_convos = threading.Timer(5, fetch_updated_messages_of_convos_and_notify_clients_of_them)
    timer_for_fetching_updated_messages_of_convos.start()


async def add_subscriber_to_convo_messages(connection, convo_id, datetime_of_oldest_tracked_message_of_convo):
    clients_and_their_datetimes_of_oldest_tracked_messages[connection] = datetime_of_oldest_tracked_message_of_convo

    if convo_id not in set_of_convo_ids:
        set_of_convo_ids.add(convo_id)
        convo_ids_and_the_datetimes_of_their_oldest_tracked_messages[convo_id] = datetime_of_oldest_tracked_message_of_convo
        convo_ids_and_the_set_of_clients_subscribed_to_their_updates[convo_id] = set()
        result_of_fetching_messages_of_convo = user_convo_and_message_info_fetching_service.get_ordered_messages_of_convo(
            convo_id, datetime_of_oldest_tracked_message_of_convo
        )
        if isinstance(result_of_fetching_messages_of_convo, list):
            await connection.send(
                {
                    'event': 'ConvoMessagesFetchingError',
                    'data': result_of_fetching_messages_of_convo[0]
                }
            )
        else:
            convo_ids_and_their_messages[convo_id] = result_of_fetching_messages_of_convo
    elif convo_ids_and_the_datetimes_of_their_oldest_tracked_messages[convo_id] != 'oldest':
        if datetime_of_oldest_tracked_message_of_convo == 'oldest':
            convo_ids_and_the_datetimes_of_their_oldest_tracked_messages[convo_id] = 'oldest'
        elif datetime_of_oldest_tracked_message_of_convo < convo_ids_and_the_datetimes_of_their_oldest_tracked_messages[convo_id]:
            convo_ids_and_the_datetimes_of_their_oldest_tracked_messages[convo_id] = datetime_of_oldest_tracked_message_of_convo

    convo_ids_and_the_set_of_clients_subscribed_to_their_updates[convo_id].add(connection)


def remove_subscriber_of_convo_messages(connection, convo_id):
    del clients_and_their_datetimes_of_oldest_tracked_messages[connection]
    convo_ids_and_the_set_of_clients_subscribed_to_their_updates[convo_id].remove(connection)

    if len(convo_ids_and_the_set_of_clients_subscribed_to_their_updates[convo_id]) == 0:
        del convo_ids_and_the_set_of_clients_subscribed_to_their_updates[convo_id]
        del convo_ids_and_their_messages[convo_id]
        del convo_ids_and_the_datetimes_of_their_oldest_tracked_messages[convo_id]
        set_of_convo_ids.remove(convo_id)
    
    else:
        new_datetime_of_oldest_tracked_message = None
        for client in convo_ids_and_the_set_of_clients_subscribed_to_their_updates[convo_id]:
            datetime_of_oldest_tracked_message = clients_and_their_datetimes_of_oldest_tracked_messages[client]
            if datetime_of_oldest_tracked_message == 'oldest':
                new_datetime_of_oldest_tracked_message = 'oldest'
                break
            elif(new_datetime_of_oldest_tracked_message is None or
            datetime_of_oldest_tracked_message < new_datetime_of_oldest_tracked_message):
                new_datetime_of_oldest_tracked_message = datetime_of_oldest_tracked_message
            
        convo_ids_and_the_datetimes_of_their_oldest_tracked_messages[convo_id] = new_datetime_of_oldest_tracked_message


websocket_server_2 = websockets.serve(on_connection, 'localhost', 8013)
asyncio.get_event_loop().run_until_complete(websocket_server_2)
asyncio.get_event_loop().run_forever()
