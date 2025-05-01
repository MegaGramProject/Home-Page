<?php

namespace App\GraphQL\Queries\User;

use App\Models\MySQL\User\PublicUser;
use App\Models\MySQL\User\PrivateUser;

use Rebing\GraphQL\Support\Query;
use GraphQL\Type\Definition\Type;
use Illuminate\Support\Facades\Redis;


class GetUsernameOfUserIdFromWebSocket extends Query {
    protected $redisClient;

    protected $attributes = [
        'name' => 'getUsernameOfUserIdFromWebSocket',
    ];


    public function __construct() {
        $this->redisClient = Redis::connection()->client();
    }

    
    public function type(): Type {
        return Type::string();
    }


    public function args(): array {
        return [
            'userId' => ['type' => Type::int()],
        ];
    }

    
    public function resolve($args) {
        $userId = $args['userId'];
        $errorMessage = '';
        $username = null;

        try {
            $username = $this->redisClient->hGet("dataForUser$userId", "username");

            if ($username == null) {
                $errorMessage .= "• User $userId does not exist\n";
                abort(404, $errorMessage);
            }
            return $username;
        }
        catch (\Exception) {
            $errorMessage .= "• There was trouble using the Redis-cache to get the username of user $userId, if that user
            even exists\n";
        }

        try {
            $username = PublicUser::where('id', $userId)->value('username');

            if ($username == null) {
                $username = PrivateUser::where('id', $userId)->value('username');
            }
            
            if ($username == null) {
                $errorMessage .= "• User $userId does not exist\n";
                abort(404, $errorMessage);
            }
            return $username;
        }
        catch (\Exception) {
            $errorMessage .= "• There was trouble using the databases to get the username of user $userId, if that user even
            exists\n";
            abort(502, $errorMessage);
        }
    }
}
