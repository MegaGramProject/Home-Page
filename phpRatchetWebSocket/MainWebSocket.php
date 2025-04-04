<?php

require 'vendor/autoload.php';

use App\Services\FollowInfoFetchingService;
use App\Services\UserInfoFetchingService;
use App\Services\UserTokenAuthService;
use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;
use DI\ContainerBuilder;
use Ramsey\Uuid\Uuid;
use React\EventLoop\LoopInterface;

use function \DI\create;
use function \DI\get;


class MainWebSocket implements MessageComponentInterface {
    protected $loop;
    protected $periodicTimerForPublicUserFollowings;
    protected $periodicTimerForPrivateUserFollowRequests;
    protected $datetimeToCheckForUpdatesOfPublicFollowings;
    protected $datetimeToCheckForUpdatesOfPrivateFollowRequests;

    protected $pendingConnections = [];
    protected $confirmedConnections = [];

    protected $usersAndTheirIsPrivateStatuses = [];
    protected $usersAndTheConnectionsSubscribedToTheirUpdates = [];

    protected $publicUserIds = [];
    protected $privateUserIds = [];

    protected $followInfoFetchingService;
    protected $userInfoFetchingService;
    protected $userTokenAuthService;


    public function __construct(
        FollowInfoFetchingService $followInfoFetchingService,
        UserInfoFetchingService $userInfoFetchingService,
        UserTokenAuthService $userTokenAuthService,
        LoopInterface $loop
    ) {
        $this->followInfoFetchingService = $followInfoFetchingService;
        $this->userInfoFetchingService = $userInfoFetchingService;
        $this->userTokenAuthService = $userTokenAuthService;
        $this->loop = $loop;
    }


    public function onOpen(ConnectionInterface $connection) {
        $connectionId = $connection->resourceId;

        $this->pendingConnections[$connectionId] = $connection;

        $this->loop->addTimer(20, function () use ($connectionId, $connection) {
            if (isset($this->pendingConnections[$connectionId])) {
                $connection->close();
            }
        });
    }


    public function onMessage(ConnectionInterface $connection, $msg) {
        $connectionId = $connection->resourceId;

        $data = json_decode($msg, true);

        if (!$data || !isset($data['event'])) {
            return;
        }

        switch ($data['event']) {
            case 'Register':
                if (!isset($this->pendingConnections[$connectionId])) {
                    $connection->send(json_encode(
                        [
                            'event' => 'BadRequestError',
                            'message' => 'You\'ve already registered to this web-socket for this connection'
                        ]
                    ));
                    break;
                }

                if (!isset($data['userId']) || !is_int($data['userId']) || $data['userId'] < 1) {
                    $connection->send(json_encode(
                        [
                            'event' => 'BadRequestError',
                            'message' => 'You didn\'t provide a valid user-id to register to this web-socket with'
                        ]
                    ));
                    break;
                }

                $userId = $data['userId'];
                
                if (!isset($data['token']) || !is_string($data['token']) || !Uuid::isValid($data['token'])) {
                    $connection->send(json_encode(
                        [
                            'event' => 'BadRequestError',
                            'message' => 'You didn\'t provide a valid token to register to this web-socket with'
                        ]
                    ));
                    break;
                }

                $token = $data['token'];

                $resultOfAuthenticatingUserToken = $this->userTokenAuthService->authenticateUsersToken(
                    $userId,
                    $token
                );
        
                if (is_bool($resultOfAuthenticatingUserToken)) {
                    if (!$resultOfAuthenticatingUserToken) {
                        $connection->send(json_encode(
                            [
                                'event' => 'UserAuthenticationError',
                                'message' =>  "The backend server could not verify you as having the credentials to be logged into this
                                websocket as user $userId"
                            ]
                        ));
                        break;
                    }
                }
                else {  
                    $connection->send(json_encode(
                        [
                            'event' => 'UserAuthenticationError',
                            'message' => $resultOfAuthenticatingUserToken[0]
                        ]
                    ));
                    break;
                }  

                if (!isset($this->usersAndTheirIsPrivateStatuses[$userId])) {
                    $resultOfGettingIsPrivateStatusOfUser = $this->userInfoFetchingService->getIsPrivateStatusOfUser(
                        $userId
                    );

                    if (is_int($resultOfGettingIsPrivateStatusOfUser)) {
                        if ($resultOfGettingIsPrivateStatusOfUser == 1) {
                            $this->usersAndTheirIsPrivateStatuses[$userId] = true;
                            $this->privateUserIds[] = $userId;
                            
                        }
                        else {
                            $this->usersAndTheirIsPrivateStatuses[$userId] = false;
                            $this->publicUserIds[] = $userId;
                        }
                    }
                    else {
                        $connection->send(json_encode(
                            [
                                'event' => 'UserAuthenticationError',
                                'message' => $resultOfGettingIsPrivateStatusOfUser[0]
                            ]
                        ));
                        break;
                    }
                }

                unset($this->pendingConnections[$connectionId]);

                if (!isset($this->usersAndTheConnectionsSubscribedToTheirUpdates[$userId])) {
                    $this->usersAndTheConnectionsSubscribedToTheirUpdates[$userId] = [];
                }

                $this->usersAndTheConnectionsSubscribedToTheirUpdates[$userId][$connectionId] = $connection;

                $this->confirmedConnections[$connectionId] = [
                    'connection' => $connection,
                    'userId' => $userId
                ];


                if (is_null($this->datetimeToCheckForUpdatesOfPrivateFollowRequests) && $this->usersAndTheirIsPrivateStatuses[$userId]) {
                    $this->datetimeToCheckForUpdatesOfPrivateFollowRequests = new DateTime();

                    $this->periodicTimerForPrivateUserFollowRequests = $this->loop->addPeriodicTimer(
                        5, function() {
                            $resultOfFetchingUpdatedFollowRequests = $this->followInfoFetchingService->
                            getUpdatedFollowRequestsOfMultiplePrivateUsers(
                                $this->datetimeToCheckForUpdatesOfPrivateFollowRequests,
                                $this->privateUserIds
                            );

                            $this->datetimeToCheckForUpdatesOfPrivateFollowRequests = new DateTime();

                            if ($resultOfFetchingUpdatedFollowRequests[1] === 'BAD_GATEWAY') {
                                foreach($this->privateUserIds as $privateUserId) {
                                    $connectionsSubscribedToThisPrivateUser = $this->usersAndTheConnectionsSubscribedToTheirUpdates[
                                        $privateUserId
                                    ];

                                    foreach($connectionsSubscribedToThisPrivateUser as $connectionId => $client) {
                                        $client->send(json_encode(
                                            [
                                                'event' => 'UpdateFetchingError',
                                                'message' => $resultOfFetchingUpdatedFollowRequests[0] + ' of user-ids whose new
                                                follow-requests are being tracked by this WebSocket-server'
                                            ]
                                        ));
                                    }
                                }
                            }
                            else {
                                $privateUsersAndTheirUpdatedFollowRequests = [];
                                foreach($resultOfFetchingUpdatedFollowRequests as $newFollowRequest) {
                                    $newFollowRequester = $newFollowRequest['requester'];
                                    $newFollowRequestee = $newFollowRequest['requestee'];

                                    if (!isset($privateUsersAndTheirUpdatedFollowRequests[$newFollowRequestee])) {
                                        $privateUsersAndTheirUpdatedFollowRequests[$newFollowRequestee] = [];
                                    }

                                    $privateUsersAndTheirUpdatedFollowRequests[$newFollowRequestee][] = $newFollowRequester;
                                }

                                foreach(array_keys($privateUsersAndTheirUpdatedFollowRequests) as $privateUserId) {
                                    $updatedFollowRequestsOfThisPrivateUser = $privateUsersAndTheirUpdatedFollowRequests[
                                        $privateUserId
                                    ];

                                    $connectionsSubscribedToThisPrivateUser = $this->usersAndTheConnectionsSubscribedToTheirUpdates[
                                        $privateUserId
                                    ];

                                    foreach($connectionsSubscribedToThisPrivateUser as $connectionId => $client) {
                                        $client->send(json_encode(
                                            [
                                                'event' => 'UpdatedFollowRequests',
                                                'data' => $updatedFollowRequestsOfThisPrivateUser
                                            ]
                                        ));
                                    }
                                }
                            }
                        }
                    );
                }
                else if (is_null($this->datetimeToCheckForUpdatesOfPublicFollowings) && !$this->usersAndTheirIsPrivateStatuses[$userId]) {
                    $this->periodicTimerForPublicUserFollowings = $this->loop->addPeriodicTimer(
                        5, function () {
                            $resultOfFetchingUpdatedFollowers = $this->followInfoFetchingService->
                            getUpdatedFollowersOfMultiplePublicUsers(
                                $this->datetimeToCheckForUpdatesOfPublicFollowings,
                                $this->publicUserIds
                            );

                            $this->datetimeToCheckForUpdatesOfPublicFollowings = new DateTime();

                            if ($resultOfFetchingUpdatedFollowers[1] === 'BAD_GATEWAY') {
                                foreach($this->publicUserIds as $publicUserId) {
                                    $connectionsSubscribedToThisPublicUser = $this->usersAndTheConnectionsSubscribedToTheirUpdates[
                                        $publicUserId
                                    ];

                                    foreach($connectionsSubscribedToThisPublicUser as $connectionId => $client) {
                                        $client->send(json_encode(
                                            [
                                                'event' => 'UpdateFetchingError',
                                                'message' => $resultOfFetchingUpdatedFollowers[0] + ' of user-ids whose new
                                                followers are being tracked by this WebSocket-server'
                                            ]
                                        ));
                                    }
                                }
                            }
                            else {
                                $publicUsersAndTheirUpdatedFollowers = [];
                                foreach($resultOfFetchingUpdatedFollowers as $newUserFollowing) {
                                    $newFollower = $newUserFollowing['follower'];
                                    $newFollowee = $newUserFollowing['followee'];

                                    if (!isset($publicUsersAndTheirUpdatedFollowers[$newFollowee])) {
                                        $publicUsersAndTheirUpdatedFollowers[$newFollowee] = [];
                                    }

                                    $publicUsersAndTheirUpdatedFollowers[$newFollowee][] = $newFollower;
                                }

                                foreach(array_keys($publicUsersAndTheirUpdatedFollowers) as $publicUserId) {
                                    $updatedFollowersOfThisPublicUser = $publicUsersAndTheirUpdatedFollowers[
                                        $publicUserId
                                    ];

                                    $connectionsSubscribedToThisPublicUser = $this->usersAndTheConnectionsSubscribedToTheirUpdates[
                                        $publicUserId
                                    ];

                                    foreach($connectionsSubscribedToThisPublicUser as $connectionId => $client) {
                                        $client->send(json_encode(
                                            [
                                                'event' => 'UpdatedFollowers',
                                                'data' => $updatedFollowersOfThisPublicUser
                                            ]
                                        ));
                                    }
                                }
                            }
                        }
                    );
                }
        }
    }


    public function onClose(ConnectionInterface $connection) {
        $connectionId = $connection->resourceId;

        unset($this->pendingConnections[$connectionId]);

        if (isset($this->confirmedConnections[$connectionId])) {
            $userId = $this->confirmedConnections[$connectionId]['userId'];
            
            unset($this->confirmedConnections[$connectionId]);
            unset($this->usersAndTheConnectionsSubscribedToTheirUpdates[$userId][$connectionId]);

            if (count($this->usersAndTheConnectionsSubscribedToTheirUpdates[$userId]) == 0) {
                if ($this->usersAndTheirIsPrivateStatuses[$userId]) {
                    $this->privateUserIds = array_filter($this->privateUserIds, function($privateUserId) use ($userId) {
                        return $privateUserId !== $userId;
                    });


                    if (!is_null($this->datetimeToCheckForUpdatesOfPrivateFollowRequests)) {
                        $this->periodicTimerForPrivateUserFollowRequests->cancel();
                        $this->datetimeToCheckForUpdatesOfPrivateFollowRequests = null;
                    }
                }
                else {
                    $this->publicUserIds = array_filter($this->publicUserIds, function($publicUserId) use ($userId) {
                        return $publicUserId !== $userId;
                    });

                    if (!is_null($this->datetimeToCheckForUpdatesOfPublicFollowings)) {
                        $this->periodicTimerForPublicUserFollowings->cancel();
                        $this->datetimeToCheckForUpdatesOfPublicFollowings = null;
                    }
                }
            }
        }
    }


    public function onError(ConnectionInterface $connection, \Exception $e) {
        $connection->close();
    }
}


$dependencyInjectionContainerBuilder = new ContainerBuilder();
$dependencyInjectionContainerBuilder->addDefinitions([
    FollowInfoFetchingService::class => create(FollowInfoFetchingService::class),
    UserInfoFetchingService::class => create(UserInfoFetchingService::class),
    UserTokenAuthService::class => create(UserTokenAuthService::class),
    LoopInterface::class => create(LoopInterface::class),

    MainWebSocket::class => create(MainWebSocket::class)->constructor(
        get(FollowInfoFetchingService::class),
        get(UserInfoFetchingService::class),
        get(UserTokenAuthService::class),
        get(LoopInterface::class)
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
