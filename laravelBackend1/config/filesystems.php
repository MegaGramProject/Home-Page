<?php

return [
    'disks' => [

        'gcsBgMusicForPostsBucket' => [
            'driver' => 'gcs',
            'key_file_path' => '~/megagram-428802-d974cd9b0ed9.json',
            'project_id' => 'megagram-428802',
            'bucket' => 'backgroundMusicOfPosts',
        ],

        's3VidSubtitlesForPostsBucket' => [
            'driver' => 's3',
            'key' => '',
            'secret' => '',
            'region' => 'us-east-1',
            'bucket' => 'vidSubtitlesOfPosts',
            'url' => '',
        ],
    ]
];
