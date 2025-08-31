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
        
        # Initialize all config values from environment
        self._load_config()
    
    def _load_config(self):
        """Load configuration values from environment variables"""
        # Database
        self.DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///filap.db')
        
        # Flask settings
        self.DEBUG = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
        self.SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
        
        # CORS settings
        cors_origins = os.getenv('CORS_ORIGINS', '*')
        self.CORS_ORIGINS = [origin.strip() for origin in cors_origins.split(',')]
        
        cors_headers = os.getenv('CORS_ALLOW_HEADERS', 'Content-Type,Authorization,X-Queue-Secret,X-User-Token')
        self.CORS_ALLOW_HEADERS = [header.strip() for header in cors_headers.split(',')]
        
        cors_methods = os.getenv('CORS_ALLOW_METHODS', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
        self.CORS_ALLOW_METHODS = [method.strip() for method in cors_methods.split(',')]
        
        # Frontend URL (for redirects, email links, etc.)
        self.FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        
        # Queue settings
        self.QUEUE_EXPIRY_HOURS = int(os.getenv('QUEUE_EXPIRY_HOURS', '24'))
        
        # Rate limiting (requests per minute)
        self.RATE_LIMIT_PER_MINUTE = int(os.getenv('RATE_LIMIT_PER_MINUTE', '60'))

class DevelopmentConfig(Config):
    """Development configuration"""
    
    def _load_config(self):
        super()._load_config()
        self.DEBUG = True

class ProductionConfig(Config):
    """Production configuration"""
    
    def _load_config(self):
        super()._load_config()
        self.DEBUG = False

class TestingConfig(Config):
    """Testing configuration"""
    
    def _load_config(self):
        super()._load_config()
        self.TESTING = True
        self.DATABASE_URL = 'sqlite:///:memory:'

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