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
    '/toggleEncryptionStatusOfBgMusicAndVidSubtitlesOfPost/{overallPostId}/{originallyIsEncrypted}',
    [BackendController::class, 'toggleEncryptionStatusOfBgMusicAndVidSubtitlesOfPost']
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

Route::middleware('throttle:8,1')->get(
    '/getProfilePhotoOfUser/{authUserId}/{userId}',
    [BackendController::class, 'getProfilePhotoOfUser']
);
Route::middleware('throttle:4,1')->post(
    '/getProfilePhotosOfMultipleUsers/{authUserId}',
    [BackendController::class, 'getProfilePhotosOfMultipleUsers']
);
Route::middleware('throttle:3,1')->post(
    '/addOwnProfilePhoto/{authUserId}',
    [BackendController::class, 'addOwnProfilePhoto']
);
Route::middleware('throttle:3,1')->patch(
    '/updateOwnProfilePhoto/{authUserId}',
    [BackendController::class, 'updateOwnProfilePhoto']
);
Route::middleware('throttle:3,1')->delete(
    '/deleteOwnProfilePhoto/{authUserId}',
    [BackendController::class, 'deleteOwnProfilePhoto']
);


Route::middleware('throttle:8,1')->get(
    '/getVerificationStatusOfUser/{authUserId}/{userId}',
    [BackendController::class, 'getVerificationStatusOfUser']
);