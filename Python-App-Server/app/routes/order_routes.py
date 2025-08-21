from flask import Blueprint, request, jsonify
from app.models import User, Product, Order, OrderProduct
from app import db
from app.auth.token_verify import verify_token # Assuming this is for user authentication/authorization
import traceback
import boto3 # Import boto3 for AWS SDK
import os    # For environment variables
import json  # For serializing message body to JSON
# from collections import Counter # No longer needed if only buying 1 at a time

order_bp = Blueprint('order_bp', __name__)

# --- Configuration for AWS SQS ---
SQS_QUEUE_NAME = os.environ.get('SQS_ORDER_CONFIRMATION_QUEUE_NAME', 'order-confirmation-queue')
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')

# Initialize SQS client
sqs_kwargs = {
    'service_name': 'sqs',
    'region_name': AWS_REGION
}

# Only add credentials if we're not running in AWS environment (local development)
if not os.environ.get('AWS_EXECUTION_ENV'):
    # Check if local credentials are available
    if os.environ.get('AWS_ACCESS_KEY_ID') and os.environ.get('AWS_SECRET_ACCESS_KEY'):
        sqs_kwargs.update({
            'aws_access_key_id': os.environ.get('AWS_ACCESS_KEY_ID'),
            'aws_secret_access_key': os.environ.get('AWS_SECRET_ACCESS_KEY')
        })
    else:
        print("Warning: Running locally but AWS credentials not found in environment variables")

sqs_client = boto3.client(**sqs_kwargs)

# --- Helper function to get SQS Queue URL ---
def get_sqs_queue_url(queue_name):
    try:
        response = sqs_client.get_queue_url(QueueName=queue_name)
        return response['QueueUrl']
    except Exception as e:
        print(f"Error getting SQS queue URL for '{queue_name}': {e}")
        raise

SQS_QUEUE_URL = get_sqs_queue_url(SQS_QUEUE_NAME)


# Route to get all products ordered by a user (UNCHANGED AS REQUESTED)
# This function will list each product individually, which is accurate if only 1 unit can be purchased at a time.
@order_bp.route('/user-orders/<user_sub>', methods=['GET'])
# You might want to add @verify_token here if this is a protected route
def get_user_orders(user_sub):
    try:
        user = User.query.filter_by(sub=user_sub).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
        orders_list = []
        for order in user.orders:
            order_dict = {
                'order_id': order.oid,
                'products': []
            }
            order_products = OrderProduct.query.filter_by(oid=order.oid).all()
            for op in order_products:
                product = Product.query.filter_by(pid=op.pid).first()
                if product:
                    order_dict['products'].append({
                        'pid': product.pid,
                        'category': product.category,
                        'gender': product.gender,
                        'productName': product.productName,
                        'size': product.size,
                        'price': str(product.price),
                        'thumbLink': product.thumbLink,
                        'quantity': op.count  # <-- Add quantity here
                    })
            orders_list.append(order_dict)
        return jsonify(orders_list)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@order_bp.route('/place-order', methods=['POST'])
# You might want to add @verify_token here if this is a protected route
def place_order():
    try:
        data = request.json
        user_sub = data.get('user_sub')
        products_to_buy = data.get('products', [])

        if not user_sub or not products_to_buy:
            return jsonify({"error": "Missing required parameters (user_sub or products)"}), 400

        if not isinstance(products_to_buy, list):
            return jsonify({"error": "'products' must be a list of objects with pid and quantity"}), 400

        user = User.query.filter_by(sub=user_sub).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        total_order_amount = 0
        order_products_to_add = []

        for item in products_to_buy:
            pid = item.get('pid')
            quantity = item.get('quantity', 1)
            if not isinstance(pid, int) or not isinstance(quantity, int) or quantity < 1:
                db.session.rollback()
                return jsonify({"error": f"Invalid product or quantity: {item}"}), 400

            product = Product.query.get(pid)
            if not product:
                db.session.rollback()
                return jsonify({"error": f"Product with ID {pid} not found"}), 404

            if product.inventory < quantity:
                db.session.rollback()
                return jsonify({"error": f"Product {product.productName} (ID: {pid}) does not have enough inventory."}), 400

            # Subtract inventory
            product.inventory -= quantity
            total_order_amount += float(product.price) * quantity

            # Create OrderProduct entry with count
            order_products_to_add.append(OrderProduct(pid=pid, count=quantity))

        # Create new order
        new_order = Order(Useruid=user.uid, total_amount=total_order_amount)
        db.session.add(new_order)
        db.session.flush()  # Get new_order.oid

        # Link order_products to the new order and add to session
        for op in order_products_to_add:
            op.oid = new_order.oid
            db.session.add(op)

        db.session.commit()

        # Send order ID to SQS
        try:
            sqs_message_body = json.dumps({"order_id": new_order.oid})
            send_response = sqs_client.send_message(
                QueueUrl=SQS_QUEUE_URL,
                MessageBody=sqs_message_body,
            )
            print(f"Order ID {new_order.oid} sent to SQS. Message ID: {send_response['MessageId']}")
        except Exception as sqs_err:
            print(f"Error sending order ID {new_order.oid} to SQS: {sqs_err}")
            traceback.print_exc()

        return jsonify({
            "message": "Order placed successfully. Confirmation email processing initiated.",
            "order_id": new_order.oid,
            "total_amount": total_order_amount
        }), 201

    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500