import psycopg2
import boto3
import os
import json
import traceback
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# Config
SES_REGION = 'us-east-1'
SES_SOURCE_EMAIL = 'orders@kronor.shop'#change to your email which you want order confirmation from
RDS_SECRET_NAME = os.environ['RDS_SECRET_NAME']  # Name of secret in Secrets Manager
RDS_SECRET_REGION = os.environ.get('AWS_REGION', 'us-east-1')

# AWS Clients
ses = boto3.client('ses', region_name=SES_REGION)
secrets_client = boto3.client('secretsmanager', region_name=RDS_SECRET_REGION)


def get_database_config():
    """
    Fetch RDS credentials from AWS Secrets Manager.
    Expected secret keys:
    username, password, engine, host, port, dbname, dbInstanceIdentifier
    """
    secret_value = secrets_client.get_secret_value(SecretId=RDS_SECRET_NAME)
    secret_dict = json.loads(secret_value['SecretString'])

    return {
        'host': secret_dict['host'],
        'user': secret_dict['username'],
        'password': secret_dict['password'],
        'dbname': secret_dict['dbname'],
        'port': secret_dict['port']
    }


def build_html_email(name, order_id, items, total_order_amount):
    items_html = ""
    for item in items:
        items_html += f"""
        <li style="display: flex; align-items: center; margin-bottom: 16px; border-bottom: 1px solid #e0e0e0; padding-bottom: 12px;">
          <img src="{item['thumb']}" alt="{item['name']}" width="80" height="80" style="border-radius: 8px; margin-right: 20px; object-fit: cover; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
          <div style="flex-grow: 1;">
            <p style="margin: 0 0 6px 0; font-size: 16px; font-weight: 600; color: #222;">{item['name']}</p>
            <p style="margin: 0; font-size: 14px; color: #555;">
            Quantity: <strong>{item['quantity']}</strong><br>
            Price: <strong>${item['price']:.2f}</strong> × {item['quantity']} = <strong>${item['total_price']:.2f}</strong></p>
          </div>
        </li>"""

    return f"""<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Your Order Confirmation</title>
</head>
<body>
  <div class="container">
    <h2>Hi {name},</h2>
    <p>Thank you for your order <strong>#{order_id}</strong>!</p>
    <p>Here are the items you ordered:</p>
    <ul>
      {items_html}
    </ul>
    <p><strong>Total Order Amount: ${total_order_amount:.2f}</strong></p>
    <p>We’ll notify you when your order ships. If you have any questions, feel free to reply to this email.</p>
    <div class="footer">
      <p>Thanks,<br/><strong>The Cloudonauts Team</strong></p>
    </div>
  </div>
</body>
</html>"""


def build_text_email(name, order_id, items, total_order_amount):
    items_text = "\n".join(
        f"- {item['name']}: ${item['price']:.2f} × {item['quantity']} = ${item['total_price']:.2f}"
        for item in items
    )
    return f"""Hi {name},

Thank you for your order (Order ID: {order_id})!

Here are the items in your order:
{items_text}

Total Order Amount: ${total_order_amount:.2f}

We'll notify you when your order ships.

Thanks,  
Cloudonauts Team
"""


def lambda_handler(event, context):
    conn = None
    cursor = None
    try:
        print("Incoming event:", json.dumps(event, indent=2))

        # Extract Order ID from SQS
        message_body = event['Records'][0]['body']
        print(f"Raw SQS message body: {message_body}")
        msg = json.loads(message_body)
        order_id = int(msg['order_id'])
        print(f"Processing order ID: {order_id}")

        # Get DB credentials from Secrets Manager
        db_config = get_database_config()

        # Connect to PostgreSQL
        conn = psycopg2.connect(
            host=db_config['host'],
            database=db_config['dbname'],
            user=db_config['user'],
            password=db_config['password'],
            port=db_config['port']
        )
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                o.oid AS order_id,
                u.email AS user_email,
                u.name AS user_name,
                p."productName" AS product_name,
                p.price AS product_price,
                p."thumbLink" AS product_thumb,
                op.count AS quantity,
                o.total_amount AS total_order_price
            FROM "order" o
            JOIN users u ON o."Useruid" = u.uid
            JOIN order_product op ON o.oid = op.oid
            JOIN product p ON op.pid = p.pid
            WHERE o.oid = %s
            ORDER BY p."productName"
        """, (order_id,))

        rows = cursor.fetchall()
        if not rows:
            return {"statusCode": 404, "body": f"No data found for order ID {order_id}"}

        user_email = rows[0][1]
        user_name = rows[0][2]
        total_order_amount = rows[0][7]
        items = [{
            "name": row[3],
            "price": row[4],
            "thumb": row[5],
            "quantity": row[6],
            "total_price": row[4] * row[6]
        } for row in rows]

        html_body = build_html_email(user_name, order_id, items, total_order_amount)
        text_body = build_text_email(user_name, order_id, items, total_order_amount)

        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"Your Order Confirmation - Order #{order_id}"
        msg['From'] = SES_SOURCE_EMAIL
        msg['To'] = user_email
        msg.attach(MIMEText(text_body, 'plain'))
        msg.attach(MIMEText(html_body, 'html'))

        response = ses.send_raw_email(
            Source=SES_SOURCE_EMAIL,
            Destinations=[user_email],
            RawMessage={'Data': msg.as_string()}
        )

        print(f"Email sent to {user_email} for order ID {order_id}. SES Message ID: {response['MessageId']}")
        return {"statusCode": 200, "body": f"Email sent successfully for order ID {order_id}"}

    except Exception as e:
        error_message = f"{type(e).__name__}: {str(e)}"
        traceback_str = traceback.format_exc()
        print("Exception occurred:", error_message)
        print("Traceback:\n", traceback_str)
        if conn:
            conn.rollback()
        return {"statusCode": 500, "body": json.dumps({"error": error_message, "trace": traceback_str})}

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
