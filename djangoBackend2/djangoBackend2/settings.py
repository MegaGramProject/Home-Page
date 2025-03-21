from pathlib import Path
import os
import pymysql

pymysql.install_as_MySQLdb()


# BASE_DIR represents the file-path of the grandparent directory of this file.
BASE_DIR = Path(__file__).resolve().parent.parent


# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('DJANGO_BACKEND_2_SECRET_KEY')


# DEBUG is a boolean which is True if Debug-mode is turned on, False otherwise. It is supposed to be False for production.
DEBUG = False

# ALLOWED_HOSTS is a list of strings representing the host/domain names that this Django site can serve.
# This is a security measure to prevent HTTP Host header attacks
ALLOWED_HOSTS = [
    os.environ.get('ALLOWED_HOST'),
    'localhost'
]


INSTALLED_APPS = [
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'my_app',
    'rest_framework',
    'corsheaders',
    'django_ratelimit',
    'graphene_django',
]


MIDDLEWARE = [
    'django_ratelimit.middleware.RatelimitMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]


ROOT_URLCONF = 'djangoBackend2.urls'


# In production, you need a WSGI-compatible server(e.g Gunicorn, uWSGI, etc) to serve a Python Django/Flask/etc project.
# When running a production server, you need to explicitly point to the WSGI callable in your wsgi.py file
WSGI_APPLICATION = 'djangoBackend2.wsgi.application'


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'Megagram',
        'USER': 'rishavry',
        'PASSWORD': os.environ.get('LOCAL_MYSQL_PASSWORD'),
        'HOST': 'localhost',
        'POST': 3306
    }
}


CORS_ALLOWED_ORIGINS = [
    'http://34.111.89.101',
    'http://localhost:8004'
]


CORS_ALLOW_CREDENTIALS = True


CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': f'redis://rishavry:{os.environ.get('AWS_REDIS_PASSWORD')}@redis-14251.c261.us-east-1-4.ec2.redns.redis-cloud.com:14251',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}


RATELIMIT_USE_CACHE = 'default'


TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

GRAPHENE = {
    "SCHEMA": "my_app.graphql.schema"
}
