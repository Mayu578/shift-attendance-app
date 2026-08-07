from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict

from .models import UserRole


# ---------- User ----------

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    name: str
    role: UserRole
    is_active: bool
    standard_work_minutes: int
    created_at: datetime


class UserUpdateRole(BaseModel):
    role: UserRole


class UserUpdateActive(BaseModel):
    is_active: bool


# ---------- Auth ----------

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ---------- Attendance ----------

class AttendanceCreate(BaseModel):
    work_date: date
    clock_in: datetime
    clock_out: Optional[datetime] = None
    break_minutes: int = 0
    note: Optional[str] = None


class AttendanceUpdate(BaseModel):
    work_date: Optional[date] = None
    clock_in: Optional[datetime] = None
    clock_out: Optional[datetime] = None
    break_minutes: Optional[int] = None
    note: Optional[str] = None


class AttendanceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    work_date: date
    clock_in: datetime
    clock_out: Optional[datetime]
    break_minutes: int
    note: Optional[str]

    # 計算値
    worked_minutes: Optional[int] = None
    overtime_minutes: Optional[int] = None
    interval_minutes_before: Optional[int] = None  # 前回退勤からのインターバル
    interval_warning: Optional[bool] = None  # インターバルが基準未満か


class MonthlySummary(BaseModel):
    year: int
    month: int
    total_worked_minutes: int
    total_overtime_minutes: int
    record_count: int
    min_interval_minutes: Optional[int] = None
    interval_warning_count: int = 0


class AttendanceListResponse(BaseModel):
    records: List[AttendanceOut]
    summary: MonthlySummary
