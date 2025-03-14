<?php

namespace App\Models\Oracle;

use Illuminate\Database\Eloquent\Model;


class PostBgMusicAndVidSubtitlesEncryptionInfo extends Model {
    protected $connection = 'oracleSQLCloud';
    
    protected $table = 'postBgMusicAndVidSubtitlesEncryptionInfo';

    protected $primaryKey = 'overallPostId';

    protected $fillable = [
        'overallPostId',
        'encryptedDataEncryptionKey',
    ];
}
