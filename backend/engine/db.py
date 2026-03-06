import pymysql
import os

def get_db():
    return pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "django_user"),
        password=os.getenv("DB_PASSWORD", "Django@123"),
        database=os.getenv("DB_NAME", "brainmint"),
        cursorclass=pymysql.cursors.DictCursor
    )