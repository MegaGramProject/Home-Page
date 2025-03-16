<?php

namespace App\Models\Oracle\PostBgMusicInfo;

use Illuminate\Database\Eloquent\Model;


class EncryptedPostBgMusicInfo extends Model {
    protected $connection = 'oracleSQLCloud';
    
    protected $table = 'encryptedPostBgMusicInfo';

    protected $primaryKey = 'overallPostId';

    protected $fillable = [
        'overallPostId',

        'audioEncryptionIv',
        'audioEncryptionAuthTag',

        'encryptedTitle',
        'titleEncryptionIv',
        'titleEncryptionAuthTag',

        'encryptedArtist',
        'artistEncryptionIv',
        'artistEncryptionAuthTag',
        
        'startTime',
        'endTime',
    ];
}
