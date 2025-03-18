<?php

namespace App\Models\MySQL\User;

use Illuminate\Database\Eloquent\Model;


class PublicUser extends Model {
    protected $connection = 'localMySQL';
    
    protected $table = 'publicUsers';

    protected $primaryKey = 'id';

    protected $fillable = [
        'id', // int
        'username', // string (max 30, required)
        'fullName', // string (max 50, required)
        'salt', // string (max 50, required)
        'hashedPassword', // string (max 50, required)
        'dateOfBirth', // datetime (required)
        'created', // datetime (auto-generated)
        'isVerified', // bool (required)
        'accountBasedIn', // string (max 75, optional)

        'encryptedContactInfo', // byte[] (required)
        'contactInfoEncryptionIv', // byte[] (required)
        'contactInfoEncryptionAuthTag', // byte[] (required)

        'encryptedDataEncryptionKey' // byte[] (required)
    ];
}
