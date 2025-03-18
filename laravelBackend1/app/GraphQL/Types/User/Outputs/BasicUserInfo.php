<?php

namespace App\GraphQL\Types\User\Outputs;

use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\InputType;
use Rebing\GraphQL\Support\Facades\GraphQL;


class BasicUserInfo extends InputType {
    protected $attributes = [
        'name' => 'BasicUserInfo',
    ];

    public function fields(): array {
        return [
            'id' => ['type' => Type::id(), 'nullable' => true],
            
            'username' => ['type' => Type::string()],
            'fullName' => ['type' => Type::string()],
            'isVerified' => ['type' => Type::boolean()],
            'isPrivate' => ['type' => Type::boolean()],

            'created' => ['type' => GraphQL::type('Datetime')]
        ];
    }
}
