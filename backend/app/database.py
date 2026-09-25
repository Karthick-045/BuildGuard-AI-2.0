import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from urllib.parse import urlparse
import pymysql
from app.config import settings

logger = logging.getLogger("buildguard")
logging.basicConfig(level=logging.INFO)

DATABASE_URL = settings.DATABASE_URL

def ensure_mysql_database(db_url: str):
    """
    If using MySQL, connect to server without database and ensure the target
    database exists before creating SQLAlchemy engine.
    """
    if db_url.startswith("mysql"):
        try:
            parsed = urlparse(db_url)
            host = parsed.hostname or "localhost"
            port = parsed.port or 3306
            user = parsed.username or "root"
            password = parsed.password or ""
            db_name = parsed.path.lstrip("/")

            if db_name:
                conn = pymysql.connect(
                    host=host,
                    port=port,
                    user=user,
                    password=password,
                    charset="utf8mb4"
                )
                with conn.cursor() as cursor:
                    cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
                conn.commit()
                conn.close()
                logger.info(f"MySQL database '{db_name}' verified/created.")
        except Exception as e:
            logger.warning(f"Could not automatically ensure MySQL database: {e}")

# Try initializing database engine
try:
    ensure_mysql_database(DATABASE_URL)
    
    if DATABASE_URL.startswith("sqlite"):
        engine = create_engine(
            DATABASE_URL, connect_args={"check_same_thread": False}
        )
    else:
        engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            pool_recycle=3600,
        )
    
    # Test connection
    with engine.connect() as test_conn:
        test_conn.execute(text("SELECT 1"))
    logger.info(f"Connected to database successfully using {DATABASE_URL.split('@')[-1]}")

except Exception as err:
    logger.warning(f"Failed to connect to primary database ({DATABASE_URL}): {err}")
    logger.info("Initializing SQLite fallback for reliable local development...")
    fallback_url = "sqlite:///./buildguard.db"
    engine = create_engine(
        fallback_url, connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
