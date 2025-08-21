from flask import Blueprint, jsonify, request
import boto3
from werkzeug.utils import secure_filename
import os
import time
from app.models import Product
from app import db

product_bp = Blueprint('product_bp', __name__)

# Configure S3
s3_kwargs = {
    'service_name': 's3',
    'region_name': os.environ.get('AWS_REGION')
}

# Only add credentials if we're not running in AWS environment (local development)
if not os.environ.get('AWS_EXECUTION_ENV'):
    # Check if local credentials are available
    if os.environ.get('AWS_ACCESS_KEY_ID') and os.environ.get('AWS_SECRET_ACCESS_KEY'):
        s3_kwargs.update({
            'aws_access_key_id': os.environ.get('AWS_ACCESS_KEY_ID'),
            'aws_secret_access_key': os.environ.get('AWS_SECRET_ACCESS_KEY')
        })
    else:
        print("Warning: Running locally but AWS credentials not found in environment variables")

s3 = boto3.client(**s3_kwargs)
BUCKET_NAME = os.environ.get('AWS_BUCKET_NAME')
S3_ACL = os.environ.get('AWS_S3_ACL', 'private')  # Default to private if not set

@product_bp.route('/add-product', methods=['POST'])
def add_product():
    try:
        # Extract product fields from form data
        category = request.form.get('category')
        gender = request.form.get('gender')
        productName = request.form.get('productName')
        size = request.form.get('size')
        price = request.form.get('price')
        count = request.form.get('count')
        description = request.form.get('description', '')  # Optional field with empty default

        if not all([category, gender, productName, size, price]) or count is None:
            return jsonify({'error': 'Missing required fields'}), 400

        # Create product entry first
        product = Product(
            category=category,
            gender=gender,
            productName=productName,
            size=size,
            price=float(price),
            inventory=int(count),
            description=description
        )
        
        # Handle image upload if present
        if 'image' in request.files:
            image = request.files['image']
            if image.filename:
                # Create a secure filename with product name
                file_extension = os.path.splitext(image.filename)[1]
                timestamp = int(time.time())
                filename = secure_filename(f"{productName}_{timestamp}{file_extension}")
                
                print(f"Attempting to upload file: {filename}")
                print(f"Bucket name: {BUCKET_NAME}")
                print(f"Content type: {image.content_type}")
                
                # Upload to S3
                try:
                    s3.upload_fileobj(
                        image,
                        BUCKET_NAME,
                        filename,
                        ExtraArgs={
                            'ContentType': image.content_type,
                            'ACL': S3_ACL,  # Use configurable ACL from environment
                            'Metadata': {
                                'productName': productName,
                                'timestamp': str(timestamp)
                            }
                        }
                    )
                    print("✅ File upload successful")
                except Exception as upload_error:
                    print(f"❌ Upload error: {str(upload_error)}")
                    raise upload_error
                
                # Generate the S3 URL
                s3_url = f"https://{BUCKET_NAME}.s3.{os.environ.get('AWS_REGION')}.amazonaws.com/{filename}"
                product.thumbLink = s3_url

        # Save to database
        db.session.add(product)
        db.session.commit()

        return jsonify({
            'message': 'Product added successfully',
            'product_id': product.pid,
            'inventory': product.inventory,
            'thumbLink': product.thumbLink
        }), 201

    except Exception as e:
        db.session.rollback()
        if 'image' in request.files and product.thumbLink:
            try:
                # Delete uploaded image if database operation failed
                s3.delete_object(Bucket=BUCKET_NAME, Key=filename)
            except:
                pass  # Ignore cleanup errors
        return jsonify({'error': str(e)}), 500

@product_bp.route('/products', methods=['GET'])
def get_all_products():
    try:
        productList = Product.query.all()
        return jsonify([{
            'pid': product.pid,
            'category': product.category,
            'gender': product.gender,
            'productName': product.productName,
            'size': product.size,
            'price': str(product.price),
            'inventory': product.inventory,
            'thumbLink': product.thumbLink,
            'description': product.description
        } for product in productList]), 200
    except Exception as e:
        return jsonify({"error": "Failed to retrieve products", "message": str(e)}), 500

@product_bp.route('/products/<int:pid>', methods=['GET'])
def get_product(pid):
    try:
        product = Product.query.get_or_404(pid)
        return jsonify({
            'pid': product.pid,
            'category': product.category,
            'gender': product.gender,
            'productName': product.productName,
            'size': product.size,
            'price': str(product.price),
            'inventory': product.inventory,
            'thumbLink': product.thumbLink,
            'description': product.description
        }), 200
    except Exception as e:
        return jsonify({"error": "Failed to retrieve product", "message": str(e)}), 500
