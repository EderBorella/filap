from flask import Flask
from flask_cors import CORS
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

# Import and register blueprints
from routes.events import events_bp
from routes.queues import queues_bp
app.register_blueprint(events_bp)
app.register_blueprint(queues_bp)

@app.route("/")
def hello():
    return "Hello, World!"

@app.route("/health")
def health():
    return {"status": "ok", "database": "connected"}

def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=db.engine)

if __name__ == "__main__":
    with app.app_context():
        create_tables()
    app.run(debug=True)