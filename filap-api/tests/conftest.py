import pytest
import os
import tempfile
from app import app
from database import db
from models.models import Base
from config import TestingConfig

@pytest.fixture(scope='session')
def test_app():
    """Create application for testing"""
    # Set testing environment
    os.environ['FLASK_ENV'] = 'testing'
    
    # Configure app for testing
    app.config.from_object(TestingConfig())
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.app_context():
        yield app

@pytest.fixture(scope='function')
def test_db(test_app):
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=db.engine)
    yield db
    db.session.remove()
    Base.metadata.drop_all(bind=db.engine)

@pytest.fixture
def client(test_app, test_db):
    """Create test client"""
    return test_app.test_client()

@pytest.fixture
def runner(test_app):
    """Create test CLI runner"""
    return test_app.test_cli_runner()