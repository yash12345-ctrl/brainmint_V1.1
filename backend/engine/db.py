import pymysql
import os

def get_db():
    # If DB_HOST is not localhost, it means we are on Render and need SSL for TiDB
    use_ssl = {"ssl": {}} if os.getenv("DB_HOST", "localhost") != "localhost" else None

    return pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 3306)), # TiDB uses port 4000
        user=os.getenv("DB_USER", "django_user"),
        password=os.getenv("DB_PASSWORD", "Django@123"),
        database=os.getenv("DB_NAME", "brainmint"),
        ssl=use_ssl, # Required for TiDB Serverless
        cursorclass=pymysql.cursors.DictCursor
    )