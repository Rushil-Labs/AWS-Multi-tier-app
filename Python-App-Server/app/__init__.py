import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv

db = SQLAlchemy()

def create_app():
    load_dotenv()

    app = Flask(__name__, template_folder='templates', static_folder='static')

    CORS_WHITE_LIST_ADDRESS = os.getenv("CORS_WHITE_LIST")

    # CORS
    CORS(app, origins=[CORS_WHITE_LIST_ADDRESS])

    # Config
    app.config.from_object('app.config.Config')

    # Init DB
    db.init_app(app)

    # Register Blueprints
    from app.routes.user_routes import user_bp
    from app.routes.product_routes import product_bp
    from app.routes.order_routes import order_bp

    app.register_blueprint(user_bp)
    app.register_blueprint(product_bp)
    app.register_blueprint(order_bp)

    return app