import pytest
import os
import tempfile
from unittest.mock import patch, mock_open
from config import Config, DevelopmentConfig, ProductionConfig, TestingConfig, get_config

@pytest.mark.unit
class TestConfig:
    
    def test_config_initialization(self):
        """Test basic config initialization"""
        config = Config()
        
        # Check defaults
        assert config.DATABASE_URL is not None
        assert config.DEBUG is not None
        assert config.SECRET_KEY is not None
        assert config.CORS_ORIGINS is not None
        assert config.QUEUE_EXPIRY_HOURS == 24
    
    @patch.dict(os.environ, {'DATABASE_URL': 'postgresql://test:test@localhost/testdb'})
    def test_config_from_environment(self):
        """Test config loads from environment variables"""
        config = Config()
        assert config.DATABASE_URL == 'postgresql://test:test@localhost/testdb'
    
    @patch.dict(os.environ, {'CORS_ORIGINS': 'http://localhost:3000,https://example.com'})
    def test_cors_origins_parsing(self):
        """Test CORS origins are parsed correctly"""
        config = Config()
        assert config.CORS_ORIGINS == ['http://localhost:3000', 'https://example.com']
    
    @patch.dict(os.environ, {'CORS_ALLOW_HEADERS': 'Content-Type,Authorization,Custom-Header'})
    def test_cors_headers_parsing(self):
        """Test CORS headers are parsed correctly"""
        config = Config()
        assert config.CORS_ALLOW_HEADERS == ['Content-Type', 'Authorization', 'Custom-Header']
    
    @patch.dict(os.environ, {'QUEUE_EXPIRY_HOURS': '48'})
    def test_integer_config_parsing(self):
        """Test integer config values are parsed correctly"""
        config = Config()
        assert config.QUEUE_EXPIRY_HOURS == 48
    
    @patch.dict(os.environ, {'FLASK_DEBUG': 'true'})
    def test_boolean_config_parsing_true(self):
        """Test boolean config parsing - true values"""
        config = Config()
        assert config.DEBUG is True
    
    @patch.dict(os.environ, {'FLASK_DEBUG': 'false'})
    def test_boolean_config_parsing_false(self):
        """Test boolean config parsing - false values"""
        config = Config()
        assert config.DEBUG is False
    
    @patch.dict(os.environ, {'FLASK_DEBUG': 'FALSE'})
    def test_boolean_config_case_insensitive(self):
        """Test boolean config is case insensitive"""
        config = Config()
        assert config.DEBUG is False

@pytest.mark.unit
class TestConfigSubclasses:
    
    def test_development_config(self):
        """Test development configuration"""
        config = DevelopmentConfig()
        assert config.DEBUG is True
    
    def test_production_config(self):
        """Test production configuration"""
        config = ProductionConfig()
        assert config.DEBUG is False
    
    def test_testing_config(self):
        """Test testing configuration"""
        config = TestingConfig()
        assert config.TESTING is True
        assert config.DATABASE_URL == 'sqlite:///:memory:'

@pytest.mark.unit
class TestConfigFactory:
    
    @patch.dict(os.environ, {'FLASK_ENV': 'development'})
    def test_get_config_development(self):
        """Test config factory returns development config"""
        config = get_config()
        assert isinstance(config, DevelopmentConfig)
        assert config.DEBUG is True
    
    @patch.dict(os.environ, {'FLASK_ENV': 'production'})
    def test_get_config_production(self):
        """Test config factory returns production config"""
        config = get_config()
        assert isinstance(config, ProductionConfig)
        assert config.DEBUG is False
    
    @patch.dict(os.environ, {'FLASK_ENV': 'testing'})
    def test_get_config_testing(self):
        """Test config factory returns testing config"""
        config = get_config()
        assert isinstance(config, TestingConfig)
        assert config.TESTING is True
    
    @patch.dict(os.environ, {'FLASK_ENV': 'unknown'})
    def test_get_config_default(self):
        """Test config factory returns development for unknown env"""
        config = get_config()
        assert isinstance(config, DevelopmentConfig)
    
    @patch.dict(os.environ, {}, clear=True)
    def test_get_config_no_env(self):
        """Test config factory when no FLASK_ENV is set"""
        config = get_config()
        assert isinstance(config, DevelopmentConfig)

@pytest.mark.integration
class TestConfigIntegration:
    
    def test_config_with_env_file(self):
        """Test config loading with .env file"""
        # Create temporary .env.development file
        env_content = """
DATABASE_URL=sqlite:///test.db
FLASK_DEBUG=true
CORS_ORIGINS=http://localhost:3000
SECRET_KEY=test-secret
QUEUE_EXPIRY_HOURS=12
"""
        
        with patch('builtins.open', mock_open(read_data=env_content)):
            with patch('os.path.exists', return_value=True):
                with patch.dict(os.environ, {'FLASK_ENV': 'development'}):
                    config = DevelopmentConfig()
                    # Note: In real scenario, dotenv would load these values
                    # This test mainly verifies the config structure
                    assert hasattr(config, 'DATABASE_URL')
                    assert hasattr(config, 'DEBUG')
                    assert hasattr(config, 'CORS_ORIGINS')
    
    def test_required_config_attributes(self):
        """Test all required config attributes are present"""
        config = Config()
        
        required_attrs = [
            'DATABASE_URL',
            'DEBUG', 
            'SECRET_KEY',
            'CORS_ORIGINS',
            'CORS_ALLOW_HEADERS',
            'CORS_ALLOW_METHODS',
            'FRONTEND_URL',
            'QUEUE_EXPIRY_HOURS',
            'RATE_LIMIT_PER_MINUTE'
        ]
        
        for attr in required_attrs:
            assert hasattr(config, attr), f"Config missing required attribute: {attr}"
            assert getattr(config, attr) is not None, f"Config attribute {attr} is None"
    
    def test_config_types(self):
        """Test config attribute types are correct"""
        config = Config()
        
        assert isinstance(config.DATABASE_URL, str)
        assert isinstance(config.DEBUG, bool)
        assert isinstance(config.SECRET_KEY, str)
        assert isinstance(config.CORS_ORIGINS, list)
        assert isinstance(config.CORS_ALLOW_HEADERS, list)
        assert isinstance(config.CORS_ALLOW_METHODS, list)
        assert isinstance(config.FRONTEND_URL, str)
        assert isinstance(config.QUEUE_EXPIRY_HOURS, int)
        assert isinstance(config.RATE_LIMIT_PER_MINUTE, int)