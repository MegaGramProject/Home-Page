<?php

namespace App\GraphQL\Queries\User;

use App\Models\MySQL\User\PublicUser;
use App\Models\MySQL\User\PrivateUser;
use App\Services\UserAuthService;

use Rebing\GraphQL\Support\Query;
use GraphQL\Type\Definition\Type;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;


class GetUserIdOfUsername extends Query {
    protected $redisClient;
    protected $userAuthService;

    protected $attributes = [
        'name' => 'getUserIdOfUsername',
    ];


    public function __construct(UserAuthService $userAuthService) {
        $this->redisClient = Redis::connection()->client();
        $this->userAuthService = $userAuthService;
    }

    
    public function type(): Type {
        return Type::int();
    }


    public function args(): array {
        return [
            'username' => ['type' => Type::string()]
        ];
    }

    
    public function resolve($args, Request $request) {
        $username = $args['username'];
        $userId = -1;
        
        try {
            $userId = $this->redisClient->get("userIdOfUser{$username}");

            if ($userId == null) {
                abort(404, "There user $username does not exist");
            }

            return $userId;
        }
        catch (\Exception) {
            //pass
        }

        try {
            $userId = PublicUser::where('username', $username)->value('id');
            
            if ($userId == null) {
                $userId = PrivateUser::where('username', $username)->value('id');
                
                if ($userId == null) {
                    abort(404, "There user $username does not exist");
                }
            }
        }
        catch (\Exception) {
            abort(502, 'There was trouble fetching the asked-for data from the database');
        }

        $userId;
    }
}
