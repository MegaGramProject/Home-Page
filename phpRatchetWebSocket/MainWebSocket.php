<?php

require 'vendor/autoload.php';

use Services\UserAuthService;
use Services\UserInfoFetchingService;

use DI\ContainerBuilder;

use function \DI\create;
use function \DI\get;

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;


class MainWebSocket implements MessageComponentInterface {
    protected $usersAndTheirConnections = [];

    protected $userIdsAndTheirUsernames = [];

    protected UserAuthService $userAuthService;

    protected UserInfoFetchingService $userInfoFetchingService;


    public function __construct(UserAuthService $userAuthService, UserInfoFetchingService $userInfoFetchingService) {
       $this->userAuthService = $userAuthService;
        $this->userInfoFetchingService = $userInfoFetchingService;
    }


    public function onOpen(ConnectionInterface $connection) {
        $connectionId = $connection->resourceId;
        $request = $connection->httpRequest;

        $query = $request->getUri()->getQuery();
        parse_str($query, $queryParams);

        $userId = $queryParams['userId'] ?? null;
        $backendId = $queryParams['backendId'] ?? null;

        $userIdIsProvided = $userId !== null;
        $backendIdIsProvided = $backendId !== null;

        if ((!$userIdIsProvided && !$backendIdIsProvided) || ($userIdIsProvided && $backendIdIsProvided)) {
            $connection->send(json_encode([
                'event' => 'BadRequestError',
                'data' => "You must either provide a userId or a backendId in order to proceed with this connection.
                Furthermore, you cannot provide both a userId and a backendId. Because you didn't follow these rules, you are
                being disconnected."
            ]));
    
            sleep(2);

            $connection->close();
            return;
        }

        if ($userIdIsProvided) {
            $userIsValid = true;

            try {
                $userId = (int) $userId;

                if ($userId < 1) {
                    $userIsValid = false;
                }
            }
            catch (\Exception $e){
                $userIsValid = false;
            }

            if (!$userIsValid) {
                $connection->send(json_encode([
                    'event' => 'BadRequestError',
                    'data' => 'The provided userId is invalid'
                ]));
        
                sleep(2);
    
                $connection->close();
                return;
            }

            $userAuthenticationResult =  $this->userAuthService->authenticateUser(
                $userId, $request
            );
    
            if (is_bool($userAuthenticationResult)) {
                if (!$userAuthenticationResult) {
                    $connection->send(json_encode([
                        'event' => 'UserAuthenticationError',
                        'data' => "The expressJSBackend1 server could not verify you as having the proper credentials to be
                        logged in as $userId"
                    ]));
            
                    sleep(2);
        
                    $connection->close();
                    return;
                }
            }
            else if (is_string($userAuthenticationResult)) {  
                $connection->send(json_encode([
                    'event' => 'UserAuthenticationError',
                    'data' => $userAuthenticationResult
                ]));

                sleep(2);
        
                $connection->close();
                return;
            }  

            if (!array_key_exists($userId, $this->usersAndTheirConnections)) {
                $this->usersAndTheirConnections[$userId] = [];
            }

            $this->usersAndTheirConnections[$userId][$connectionId] = $connection;

            $connection->userId = $userId;
        }

        if ($backendIdIsProvided) {
            $acceptedBackendIds = ['djangoBackend2'];

            if (!in_array($backendId, $acceptedBackendIds)) {
                $connection->send(json_encode([
                    'event' => 'BadRequestError',
                    'data' => 'The provided backendId is invalid'
                ]));
        
                sleep(2);
    
                $connection->close();
                return;
            }

            $connection->backendId = $backendId;
        }
    }


    public function onMessage(ConnectionInterface $connection, $data) {
        if (!isset($connection->backendId)) {
            return;
        }

        $data = json_decode($data, true);

        switch ($data['event']) {
            case 'Following':
            case 'Unfollowing':
                $followerId = $data['data']['followerId'];
                $followedId = $data['data']['followedId'];

                $followerName = '';

                if (array_key_exists($followerId, $this->userIdsAndTheirUsernames)) {
                    $followerName = $this->userIdsAndTheirUsernames[$followerId];
                }
                else {
                    $followerName = $this->userInfoFetchingService->getUsernameOfUser($followerId);
                    
                    if ($followerName !== "user $followerId") {
                        $this->userIdsAndTheirUsernames[$followerId] = $followerName;
                    }
                }

                foreach($this->usersAndTheirConnections[$followedId] as $_ => $client) {
                    $client->send(json_encode([
                        'event' => $data['event'],
                        'data' => [
                            'followerId' => $followerId,
                            'followerName' => $followerName,
                        ]
                    ]));
                }
            case 'FollowRequest':
            case 'FollowRequestCancellation':
                $requesterId = $data['data']['requesterId'];
                $requestedId = $data['data']['requestedId'];

                $requesterName = '';

                if (array_key_exists($requesterId, $this->userIdsAndTheirUsernames)) {
                    $requesterName = $this->userIdsAndTheirUsernames[$requesterId];
                }
                else {
                    $requesterName = $this->userInfoFetchingService->getUsernameOfUser($requesterId);
                    
                    if ($requesterName !== "user $requesterId") {
                        $this->userIdsAndTheirUsernames[$requesterId] = $requesterName;
                    }
                }

                foreach($this->usersAndTheirConnections[$requestedId] as $_ => $client) {
                    $client->send(json_encode([
                        'event' => $data['event'],
                        'data' => [
                            'requesterId' => $requesterId,
                            'requesterName' => $requesterName,
                        ]
                    ]));
                }
        }
    }


    public function onError(ConnectionInterface $connection, \Exception $e) {
        $connection->send(json_encode([
            'event' => 'Error',
            'data' => [
                'ExceptionMessage' =>  $e->getMessage()
            ]
        ]));
    }


    public function onClose(ConnectionInterface $connection) {
        if (isset($connection->userId)) {
            unset($this->usersAndTheirConnections[$connection->userId][$connection->resourceId]);
            if (count($this->usersAndTheirConnections[$connection->userId]) == 0) {
                unset($this->usersAndTheirConnections[$connection->userId]);
            }
        }
    }
}


$dependencyInjectionContainerBuilder = new ContainerBuilder();
$dependencyInjectionContainerBuilder->addDefinitions([
    UserAuthService::class => create(UserAuthService::class),
    UserInfoFetchingService::class => create(UserInfoFetchingService::class),

    MainWebSocket::class => create(MainWebSocket::class)->constructor(
        get(UserAuthService::class),
        get(UserInfoFetchingService::class),
    )
]);
$container = $dependencyInjectionContainerBuilder->build();


$server = $container->get(MainWebSocket::class);

$server = IoServer::factory(
    new HttpServer(
        new WsServer(
            $server
        )
    ),
    8011
);

$server->run();
