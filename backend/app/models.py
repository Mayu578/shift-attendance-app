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
    # 月間所定労働時間(分)。変形労働時間制のため、日々の残業は予定シフトとの差分で計算し、
    # これは月次サマリーの参考値(例: 175時間 = 10500分)として使う
    standard_work_minutes = Column(Integer, default=175 * 60)
    # 時給・残業時給(円)。稼いだ金額の可視化に使う
    hourly_wage = Column(Integer, default=0)
    overtime_hourly_wage = Column(Integer, default=0)
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

    # 会社が組んだ予定シフト(変形労働時間制のため、日によって時間が異なる)
    scheduled_start = Column(DateTime, nullable=True)
    scheduled_end = Column(DateTime, nullable=True)

    # 実際の出勤・退勤日時（日をまたぐ勤務に対応するためdatetime型）
    clock_in = Column(DateTime, nullable=False)
    clock_out = Column(DateTime, nullable=True)

    break_minutes = Column(Integer, default=0)
    note = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="attendances")
