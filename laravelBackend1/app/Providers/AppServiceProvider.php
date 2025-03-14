<?php

namespace App\Providers;

use App\Services\EncryptionAndDecryptionService;
use App\Services\PostBgMusicService;
use App\Services\PostInfoFetchingService;
use App\Services\UserAuthService;

use Illuminate\Support\ServiceProvider;
use Google\Cloud\Kms\V1\KeyManagementServiceClient;

class AppServiceProvider extends ServiceProvider
{

    
    public function register(): void
    {
        $this->app->singleton(KeyManagementServiceClient::class, function ($app) {
            return new KeyManagementServiceClient();
        });

        $this->app->singleton(EncryptionAndDecryptionService::class, function ($app) {
            return new EncryptionAndDecryptionService();
        });

        $this->app->singleton(PostBgMusicService::class, function ($app) {
            return new PostBgMusicService();
        });

        $this->app->singleton(PostInfoFetchingService::class, function ($app) {
            return new PostInfoFetchingService();
        });

        $this->app->singleton(UserAuthService::class, function ($app) {
            return new UserAuthService();
        });
    }

    
    public function boot(): void
    {
        
    }
}
