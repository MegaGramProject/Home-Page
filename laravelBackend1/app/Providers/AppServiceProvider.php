<?php

namespace App\Providers;

use App\Services\EncryptionAndDecryptionService;
use App\Services\PostBgMusicService;
use App\Services\PostInfoFetchingService;
use App\Services\UserAuthService;
use App\Services\PostVidSubtitlesService;

use Illuminate\Support\ServiceProvider;
use Google\Cloud\Kms\V1\KeyManagementServiceClient;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;


class AppServiceProvider extends ServiceProvider
{

    
    public function register(): void
    {
        $this->app->singleton(KeyManagementServiceClient::class, function ($app) {
            return new KeyManagementServiceClient();
        });

        $this->app->singleton(EncryptionAndDecryptionService::class, function ($app) {
            return new EncryptionAndDecryptionService($app->make(KeyManagementServiceClient::class));
        });

        $this->app->singleton(PostBgMusicService::class, function ($app) {
            return new PostBgMusicService();
        });

        $this->app->singleton(PostInfoFetchingService::class, function ($app) {
            return new PostInfoFetchingService();
        });

        $this->app->singleton(PostVidSubtitlesService::class, function ($app) {
            return new PostVidSubtitlesService();
        });

        $this->app->singleton(UserAuthService::class, function ($app) {
            return new UserAuthService();
        });
    }

    
    public function boot(): void {
        RateLimiter::for('graphql_rate-limit-3-per-min', function () {
            return Limit::perMinute(3);
        });
    
        RateLimiter::for('graphql_rate-limit-8-per-min', function () {
            return Limit::perMinute(8);
        });

        RateLimiter::for('graphql_rate-limit-10-per-min', function () {
            return Limit::perMinute(10);
        });
    }
}
