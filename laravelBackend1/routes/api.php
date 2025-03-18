<?php

use Illuminate\Support\Facades\Route; 

use App\Http\Controllers\BackendController;

Route::middleware('throttle:4,1')->get(
    '/getBgMusicOfPost/{authUserId}/{overallPostId}',
    [BackendController::class, 'getBgMusicOfPost']
);

Route::post(
    '/getBgMusicOfMultiplePosts',
    [BackendController::class, 'getBgMusicOfMultiplePosts']
);

Route::post(
    '/addBgMusicToPost/{overallPostId}/{isEncrypted}',
    [BackendController::class, 'addBgMusicToPost']
);

Route::post(
    '/addEncryptionInfoForBgMusicAndVidSubsOfNewlyUploadedEncryptedPost/{overallPostId}',
    [BackendController::class, 'addEncryptionInfoForBgMusicAndVidSubsOfNewlyUploadedEncryptedPost']
);

Route::patch(
    '/updateBgMusicOfPost/{overallPostId}/{isEncrypted}',
    [BackendController::class, 'updateBgMusicOfPost']
);

Route::delete(
    '/removeBgMusicFromPost/{overallPostId}/{isEncrypted}',
    [BackendController::class, 'removeBgMusicFromPost']
);


Route::middleware('throttle:4,1')->get(
    '/getVidSubtitlesOfPost/{authUserId}/{overallPostId}',
    [BackendController::class, 'getVidSubtitlesOfPost']
);

Route::post(
    '/getVidSubtitlesOfMultiplePosts',
    [BackendController::class, 'getVidSubtitlesOfMultiplePosts']
);

Route::post(
    '/addVidSubtitleFilesToPost/{overallPostId}/{isEncrypted}',
    [BackendController::class, 'addVidSubtitleFilesToPost']
);

Route::middleware('throttle:4,1')->patch(
    '/setOrUnsetDefaultVidSubtitleFilesOfPost/{overallPostId}',
    [BackendController::class, 'setOrUnsetDefaultVidSubtitleFilesOfPost']
);

Route::delete(
    '/removeSpecifiedVidSubtitleFilesFromPost/{overallPostId}/{isEncrypted}',
    [BackendController::class, 'removeSpecifiedVidSubtitleFilesFromPost']
);

Route::delete(
    '/removeBgMusicAndVidSubtitlesFromPostAfterItsDeletion/{overallPostId}/{isEncrypted}',
    [BackendController::class, 'removeBgMusicAndVidSubtitlesFromPostAfterItsDeletion']
);
