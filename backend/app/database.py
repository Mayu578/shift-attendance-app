import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# ローカル開発はSQLite、本番(Render等)はDATABASE_URL環境変数のPostgreSQLを使う
SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./attendance.db")

# RenderのPostgreSQL URLは "postgres://" 形式のことがあるが、
# SQLAlchemy 2.x は "postgresql://" を要求するため変換する
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace(
        "postgres://", "postgresql://", 1
    )

connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
