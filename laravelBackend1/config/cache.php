<?php

use Illuminate\Support\Str;

return [


    'default' => env('CACHE_STORE', 'database'),

    'stores' => [
        'redis' => [
            'driver' => 'redis',
            'connection' => env('REDIS_CONNECTION_STRING', 'cache')
        ]
    ],

    'prefix' => env('CACHE_PREFIX', Str::slug(env('APP_NAME', 'laravel'), '_').'_cache_'),

];
