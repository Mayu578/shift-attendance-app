import enum
from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Date,
    ForeignKey,
    Enum,
    Boolean,
)
from sqlalchemy.orm import relationship

from .database import Base


class UserRole(str, enum.Enum):
    staff = "staff"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.staff, nullable=False)
    is_active = Column(Boolean, default=True)
    # 所定労働時間(分)。ユーザーごとに異なる場合に備え、デフォルト8時間
    standard_work_minutes = Column(Integer, default=480)
    created_at = Column(DateTime, default=datetime.utcnow)

    attendances = relationship(
        "Attendance", back_populates="user", cascade="all, delete-orphan"
    )


class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # 勤務日（表示・月次集計のグルーピング用）
    work_date = Column(Date, nullable=False)

    # 実際の出勤・退勤日時（日をまたぐ勤務に対応するためdatetime型）
    clock_in = Column(DateTime, nullable=False)
    clock_out = Column(DateTime, nullable=True)

    break_minutes = Column(Integer, default=0)
    note = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="attendances")
