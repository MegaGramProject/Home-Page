from services import authenticate_user, get_username_of_user

import json 

import asyncio
import websockets

from urllib.parse import urlparse, parse_qs

users_and_their_connections = {}

user_ids_and_their_usernames = {}


async def on_connection(connection, path):
    parsed_url = urlparse(path)
    query_params = parse_qs(parsed_url.query)

    user_id = query_params.get('userId', [None])[0]
    backend_id = query_params.get('backendId', [None])[0]

    user_id_is_provided = user_id is not None
    backend_id_is_provided = backend_id is not None

    if (not user_id_is_provided and not backend_id_is_provided) or (user_id_is_provided and backend_id_is_provided):
        await connection.close(code=4400, reason='''You must either provide a userId or a backendId in order to proceed with this
        connection. Furthermore, you cannot provide both a userId and a backendId.''')
        return
    
    if user_id_is_provided:
        user_id_is_valid = True

        try:
            user_id = int(user_id)
            if user_id < 1:
                user_id_is_valid = False
        except:
            user_id_is_valid = False

        if not user_id_is_valid:
            await connection.close(code=4400, reason='The provided userId is invalid')
            return
        
        cookie_header = connection.request_headers.get('Cookie')
        cookies = {}

        if cookie_header:
            cookie_parts = cookie_header.split(';')
            for part in cookie_parts:
                if '=' in part:
                    k, v = part.strip().split('=', 1)
                    cookies[k] = v

        user_authentication_result = authenticate_user(cookies, user_id)

        if isinstance(user_authentication_result, bool):
            if not user_authentication_result:
                await connection.close(code=4403, reason=
                    f'''The expressJSBackend1 server could not verify you as having the proper credentials to be logged in as
                    user {user_id}'''
                )
                return
        elif isinstance(user_authentication_result, str):
            if user_authentication_result == 'The provided authUser token, if any, in your cookies has an invalid structure.':
                await connection.close(code=4403, reason=user_authentication_result)
                return
            await connection.close(code=5502, reason=user_authentication_result)
            return

        if user_id not in users_and_their_connections:
            users_and_their_connections[user_id] = []
        users_and_their_connections[user_id].append(connection)

        connection.user_id = user_id
    
    if backend_id_is_provided:
        accepted_backend_ids = ['djangoBackend2']
        if backend_id not in accepted_backend_ids:
            await connection.close(code=4400, reason='The provided backend-id was invalid')
            return
        
        connection.backend_id = backend_id
    
    try:
        async for message in connection:
            if not hasattr(connection, 'backend_id'):
                continue
            
            data = json.loads(message)

            if data['event'] == 'Message':
                members = data['data']['members']
                at_least_one_member_is_connected = False

                for member in members:
                    if member in users_and_their_connections:
                        at_least_one_member_is_connected = True
                        break
                
                if not at_least_one_member_is_connected:
                    continue

                message_id = data['data']['messageId']
                convo_id = data['data']['convoId']
                convo_title = data['data']['convoTitle']
                is_group_chat = data['data']['isGroupChat']
                sender_id = data['data']['senderId']
                message = data['data']['message']

                sender_name = ''

                if sender_id in user_ids_and_their_usernames:
                    sender_name = user_ids_and_their_usernames[sender_id]
                else:
                    sender_name = get_username_of_user(sender_id)
                    if sender_name != 'user ' + sender_id:
                        user_ids_and_their_usernames[sender_id] = sender_name

                for member in members:
                    for client in users_and_their_connections.get(member, []):
                        await client.send(json.dumps(
                            {
                                'event': 'Message',
                                'data': {
                                    'messageId': message_id,
                                    'convoId': convo_id,
                                    'convoTitle': convo_title,
                                    'isGroupChat': is_group_chat,
                                    'senderId': sender_id,
                                    'senderName': sender_name,
                                    'message': message
                                }
                            }
                        ))
            else:
                members = data['data']['members']
                at_least_one_member_is_connected = False

                for member in members:
                    if member in users_and_their_connections:
                        at_least_one_member_is_connected = True
                        break
                
                if not at_least_one_member_is_connected:
                    continue

                message_id = data['data']['messageId']
                convo_id = data['data']['convoId']
                convo_title = data['data']['convoTitle']
                is_group_chat = data['data']['isGroupChat']
                sender_id = data['data']['senderId']
                message = data['data']['message']

                sender_name = ''

                if sender_id in user_ids_and_their_usernames:
                    sender_name = user_ids_and_their_usernames[sender_id]
                else:
                    sender_name = get_username_of_user(sender_id)
                    if sender_name != 'user ' + sender_id:
                        user_ids_and_their_usernames[sender_id] = sender_name

                for member in members:
                    for client in users_and_their_connections.get(member, []):
                        await client.send(json.dumps(
                            {
                                'event': 'MessageDelete',
                                'data': {
                                    'messageId': message_id,
                                    'convoId': convo_id,
                                    'convoTitle': convo_title,
                                    'isGroupChat': is_group_chat,
                                    'senderId': sender_id,
                                    'senderName': sender_name,
                                    'message': message
                                }
                            }
                        ))
    except websockets.ConnectionClosed:
        if hasattr(connection, 'user_id'):
            users_and_their_connections[user_id].remove(connection)
            if len(users_and_their_connections[user_id]) == 0:
                del users_and_their_connections[user_id]

                
async def main():
    async with websockets.serve(on_connection, 'localhost', 8012):
        print('This WebSocket-Server, for user-messaging updates, is running at port 8012')
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())