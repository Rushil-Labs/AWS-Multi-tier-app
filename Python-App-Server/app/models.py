from app import db
class User(db.Model):
    __tablename__ = 'users'

    uid = db.Column(db.Integer, primary_key=True)
    sub = db.Column(db.String(255), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True)
    name = db.Column(db.String(255))

    orders = db.relationship('Order', back_populates='user')

class Order(db.Model):
    __tablename__ = 'order'

    oid = db.Column(db.Integer, primary_key=True)
    Useruid = db.Column(db.Integer, db.ForeignKey('users.uid'), nullable=False)
    total_amount = db.Column(db.Numeric(10, 2), nullable=True)  # Add this if you want

    user = db.relationship('User', back_populates='orders')
    order_products = db.relationship('OrderProduct', back_populates='order')
    products = db.relationship('Product', secondary='order_product', viewonly=True)

class OrderProduct(db.Model):
    __tablename__ = 'order_product'

    id = db.Column(db.Integer, primary_key=True)
    oid = db.Column(db.Integer, db.ForeignKey('order.oid'), nullable=False)
    pid = db.Column(db.Integer, db.ForeignKey('product.pid'), nullable=False)
    count = db.Column(db.Integer, default=1)  # Assuming each order product is one unit
    
    # Add relationships to both Order and Product
    order = db.relationship('Order', back_populates='order_products')
    product = db.relationship('Product', back_populates='order_products')

class Product(db.Model):
    __tablename__ = 'product'

    pid = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(255))
    gender = db.Column(db.String(255))  # Changed from char to String to match ERD
    productName = db.Column(db.String(255))
    size = db.Column(db.String(255))
    price = db.Column(db.Numeric(10, 2))
    imageLink = db.Column(db.String(255))
    thumbLink = db.Column(db.String(255))
    inventory = db.Column(db.Integer)
    description = db.Column(db.Text)  # Changed to Text type for longer descriptions

    # Update the relationship to use OrderProduct
    order_products = db.relationship('OrderProduct', back_populates='product')
    orders = db.relationship('Order', secondary='order_product', viewonly=True)