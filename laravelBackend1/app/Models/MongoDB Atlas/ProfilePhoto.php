<?php

namespace App\Models\MongoDB_Atlas;

//use Jenssegers\Mongodb\Eloquent\Model;
use Illuminate\Database\Eloquent\Model;


class ProfilePhoto extends Model {
    protected $connection = 'mongodbAtlas';
    protected $fillable = ['userId', 'profilePhoto'];
    protected $primaryKey = 'userId';
}
