from flask import Flask
from flask_cors import CORS
from flasgger import Swagger
from config import get_config
from database import db, init_db

# Initialize Flask app
app = Flask(__name__)

# Load configuration
config = get_config()
app.config['SQLALCHEMY_DATABASE_URI'] = config.DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['DEBUG'] = config.DEBUG
app.config['SECRET_KEY'] = config.SECRET_KEY

# Initialize CORS
CORS(app, 
     origins=config.CORS_ORIGINS,
     allow_headers=config.CORS_ALLOW_HEADERS,
     methods=config.CORS_ALLOW_METHODS,
     supports_credentials=True)

# Initialize SQLAlchemy
init_db(app)

# Import models after db initialization
from models.models import Base, Queue, Message, MessageUpvote

# Configure Swagger/OpenAPI
swagger_config = {
    "headers": [],
    "specs": [
        {
            "endpoint": 'apispec_1',
            "route": '/api/spec.json',
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/api/docs/"
}

swagger_template = {
    "swagger": "2.0",
    "info": {
        "title": "Filap API",
        "description": "A minimal live Q&A API for hosts and audiences",
        "version": "1.0.0",
        "termsOfService": "",
        "contact": {
            "name": "Filap API Support"
        }
    },
    "host": "localhost:5000",
    "basePath": "",
    "schemes": ["http", "https"],
    "operationId": "getmyData",
    "consumes": ["application/json"],
    "produces": ["application/json"],
    "securityDefinitions": {
        "HostSecret": {
            "type": "apiKey",
            "name": "X-Queue-Secret",
            "in": "header"
        },
        "UserToken": {
            "type": "apiKey", 
            "name": "X-User-Token",
            "in": "header"
        }
    }
}

swagger = Swagger(app, config=swagger_config, template=swagger_template)

# Import and register blueprints
from routes.events import events_bp
from routes.queues import queues_bp
from routes.messages import messages_bp
app.register_blueprint(events_bp)
app.register_blueprint(queues_bp)
app.register_blueprint(messages_bp)

@app.route("/")
def hello():
    return "Hello, World!"

@app.route("/health")
def health():
    return {"status": "ok", "database": "connected"}

def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=db.engine)

def init_app():
    """Initialize the application with database tables"""
    with app.app_context():
        create_tables()
    return app

if __name__ == "__main__":
    import os
    init_app()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=config.DEBUG)