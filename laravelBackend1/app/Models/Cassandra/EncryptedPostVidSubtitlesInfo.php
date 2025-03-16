<?php

namespace App\Models\Cassandra;

use Illuminate\Database\Eloquent\Model;


class EncryptedPostVidSubtitlesInfo extends Model {
    protected $connection = 'awsApacheCassandra';
    
    protected $table = 'encryptedPostVidSubtitlesInfo';

    protected $primaryKey = ['overallPostId', 'slideNumber', 'langCode'];

    protected $fillable = [
        'overallPostId',
        'slideNumber',
        'langCode',

        'fileEncryptionIv',
        'fileEncryptionAuthTag'
    ];
}
