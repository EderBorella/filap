import os
from dotenv import load_dotenv

class Config:
    """Base configuration class"""
    
    def __init__(self):
        # Load environment-specific .env file
        env = os.getenv('FLASK_ENV', 'development')
        
        if env == 'development':
            load_dotenv('.env.development')
        elif env == 'production':
            load_dotenv('.env.production')
        else:
            load_dotenv()  # Load default .env
    
    # Database
    DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///filap.db')
    
    # Flask settings
    DEBUG = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # CORS settings
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')
    CORS_ALLOW_HEADERS = os.getenv('CORS_ALLOW_HEADERS', 'Content-Type,Authorization,X-Queue-Secret,Voter-Token').split(',')
    CORS_ALLOW_METHODS = os.getenv('CORS_ALLOW_METHODS', 'GET,POST,PUT,PATCH,DELETE,OPTIONS').split(',')
    
    # Frontend URL (for redirects, email links, etc.)
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    
    # Queue settings
    QUEUE_EXPIRY_HOURS = int(os.getenv('QUEUE_EXPIRY_HOURS', '24'))
    
    # Rate limiting (requests per minute)
    RATE_LIMIT_PER_MINUTE = int(os.getenv('RATE_LIMIT_PER_MINUTE', '60'))

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DATABASE_URL = 'sqlite:///:memory:'

# Configuration factory
def get_config():
    env = os.getenv('FLASK_ENV', 'development')
    
    if env == 'development':
        return DevelopmentConfig()
    elif env == 'production':
        return ProductionConfig()
    elif env == 'testing':
        return TestingConfig()
    else:
        return DevelopmentConfig()  # Default to development