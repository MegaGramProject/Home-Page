<?php

namespace App\GraphQL\Queries\User;

use App\Models\MySQL\User\PublicUser;

use Rebing\GraphQL\Support\Query;
use GraphQL\Type\Definition\Type;


class GetIdsOfAllPublicUsers extends Query {
    protected $attributes = [
        'name' => 'getIdsOfAllPublicUsers',
    ];


    public function __construct() {}

    
    public function type(): Type {
        return Type::listOf(Type::int());
    }


    public function args(): array {
        return [];
    }

    
    public function resolve($args) {
        $userIds = $args['userIds'];
        $errorMessage = '';

        try {
            return PublicUser::whereIn('id', $userIds)
                ->pluck('id')
                ->toArray();
        }
        catch (\Exception) {
            $errorMessage .= '• There was trouble fetching the ids of all the public-users from the database\n';
            abort(
                502,
                $errorMessage
            );
        }
    }
}
