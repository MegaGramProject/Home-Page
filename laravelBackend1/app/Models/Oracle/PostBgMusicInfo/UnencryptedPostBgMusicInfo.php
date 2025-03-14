<?php

namespace App\Models\Oracle\PostBgMusicInfo;

use Illuminate\Database\Eloquent\Model;


class UnencryptedPostBgMusicInfo extends Model {
    protected $connection = 'oracleSQLCloud';
    
    protected $table = 'unencryptedPostBgMusicInfo';

    protected $primaryKey = 'overallPostId';

    protected $fillable = [
        'overallPostId',
        'title',
        'artist',
        'startTime',
        'endTime',
    ];
}
