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

        'awsApacheCassandra' => [
            'driver'         => 'cassandra',
            'host'           => '',
            'port'           => '9142',
            'keyspace'       => '',
            'username'       => 'rishavry',
            'password'       => env('AWS_APACHE_CASSANDRA_PASSWORD')
        ],

        'localMySQL' => [
            'driver'         => 'mysql',
            'host'           => '',
            'port'           => '3306',
            'database'       => 'Megagram',
            'username'       => 'rishavry',
            'password'       => env('LOCAL_MYSQL_PASSWORD'),
        ],
    ],

    'redis' => [
        'client' => 'phpredis',

        'default' => [
            'url' => '',
            'host' => '',
            'username' => 'rishavry',
            'password' => env('REDIS_CLOUD_PASSWORD'),
            'port' => '6739',
            'database' => '0'
        ],
    ],
];
