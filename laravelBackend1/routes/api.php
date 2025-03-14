<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route; 

use App\Http\Controllers\BackendController;

Route::middleware('throttle:4,1')::get(
    '/getBgMusicOfPost/{authUserId}/{overallPostId}',
    [BackendController::class, 'getBgMusicOfPost']
);

Route::post(
    '/getBgMusicOfMultiplePosts',
    [BackendController::class, 'getBgMusicOfMultiplePosts']
);

Route::post(
    '/addBgMusicToPost/{authUserId}/{overallPostId}/{isEncrypted}',
    [BackendController::class, 'addBgMusicToPost']
);

Route::post(
    '/addEncryptionInfoForBgMusicAndVidSubsOfNewlyUploadedEncryptedPost/{overallPostId}',
    [BackendController::class, 'addEncryptionInfoForBgMusicAndVidSubsOfNewlyUploadedEncryptedPost']
);

Route::patch(
    '/updateBgMusicOfPost/{authUserId}/{overallPostId}/{isEncrypted}',
    [BackendController::class, 'updateBgMusicOfPost']
);

Route::delete(
    '/removeBgMusicFromPost/{authUserId}/{overallPostId}/{isEncrypted}',
    [BackendController::class, 'removeBgMusicFromPost']
);