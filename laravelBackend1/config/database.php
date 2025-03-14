<?php

use Illuminate\Support\Str;

return [
    'connections' => [
        'oracleSQLCloud' => [
            'driver'         => 'oracle',
            'host'           => '',
            'port'           => '1521',
            'database'       => 'Megagram',
            'username'       => 'rishavry',
            'password'       => env('ORACLE_SQL_CLOUD_PASSWORD'),
        ],
        
    ],

    'redis' => [
        'client' => 'phpredis',

        'default' => [
            'url' => '',
            'host' => '',
            'username' => 'rishavry',
            'password' => env('REDIS_PASSWORD'),
            'port' => '6739',
            'database' => '0'
        ],
    ],
];
