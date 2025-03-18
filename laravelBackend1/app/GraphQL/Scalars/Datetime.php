<?php

namespace App\GraphQL\Scalars;

use Carbon\Carbon;
use GraphQL\Type\Definition\ScalarType;

class Datetime extends ScalarType {
    public $name = 'Datetime';


    //Converts stored date into ISO 8601 format for the client
    public function serialize($value) {
        return Carbon::parse($value)->toIso8601String();
    }


    //Converts incoming GraphQL variables into a Carbon instance before storing them in the database.
    public function parseValue($value) {
        return Carbon::parse($value);
    }


    //Converts inline GraphQL inputs to Carbon
    public function parseLiteral($value, array $variables = null) {
        return Carbon::parse($value);
    }
}
