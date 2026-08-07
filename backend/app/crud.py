from typing import List, Optional
from datetime import date, datetime
from sqlalchemy.orm import Session
from sqlalchemy import extract

from . import models, schemas

# 勤務間インターバルの推奨最低時間（分）。労働時間等設定改善法の努力義務の目安である11時間を採用
INTERVAL_MINIMUM_MINUTES = 11 * 60


# ---------- User ----------

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()


def get_user(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()


def list_users(db: Session) -> List[models.User]:
    return db.query(models.User).order_by(models.User.created_at).all()


def create_user(db: Session, user_in: schemas.UserCreate, hashed_password: str, role: models.UserRole = models.UserRole.staff) -> models.User:
    # 最初の1人だけ自動的に管理者にする(初期セットアップ用)
    is_first_user = db.query(models.User).count() == 0
    user = models.User(
        email=user_in.email,
        hashed_password=hashed_password,
        name=user_in.name,
        role=models.UserRole.admin if is_first_user else role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user_role(db: Session, user: models.User, role: models.UserRole) -> models.User:
    user.role = role
    db.commit()
    db.refresh(user)
    return user


def update_user_active(db: Session, user: models.User, is_active: bool) -> models.User:
    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user: models.User) -> None:
    db.delete(user)
    db.commit()


# ---------- Attendance ----------

def create_attendance(db: Session, user_id: int, data: schemas.AttendanceCreate) -> models.Attendance:
    record = models.Attendance(user_id=user_id, **data.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_attendance(db: Session, record_id: int) -> Optional[models.Attendance]:
    return db.query(models.Attendance).filter(models.Attendance.id == record_id).first()


def update_attendance(db: Session, record: models.Attendance, data: schemas.AttendanceUpdate) -> models.Attendance:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return record


def delete_attendance(db: Session, record: models.Attendance) -> None:
    db.delete(record)
    db.commit()


def list_attendances_for_user(
    db: Session, user_id: int, year: Optional[int] = None, month: Optional[int] = None
) -> List[models.Attendance]:
    query = db.query(models.Attendance).filter(models.Attendance.user_id == user_id)
    if year is not None:
        query = query.filter(extract("year", models.Attendance.work_date) == year)
    if month is not None:
        query = query.filter(extract("month", models.Attendance.work_date) == month)
    return query.order_by(models.Attendance.work_date, models.Attendance.clock_in).all()


def list_attendances_for_user_around(db: Session, user_id: int) -> List[models.Attendance]:
    """インターバル計算のため、直近の全レコードを日付順で取得"""
    return (
        db.query(models.Attendance)
        .filter(models.Attendance.user_id == user_id)
        .order_by(models.Attendance.work_date, models.Attendance.clock_in)
        .all()
    )


def list_all_attendances(
    db: Session, year: Optional[int] = None, month: Optional[int] = None
) -> List[models.Attendance]:
    query = db.query(models.Attendance)
    if year is not None:
        query = query.filter(extract("year", models.Attendance.work_date) == year)
    if month is not None:
        query = query.filter(extract("month", models.Attendance.work_date) == month)
    return query.order_by(models.Attendance.user_id, models.Attendance.work_date).all()


# ---------- 計算ロジック ----------

def compute_record_metrics(
    record: models.Attendance,
    standard_work_minutes: int,
    previous_clock_out: Optional[datetime],
) -> dict:
    worked_minutes = None
    overtime_minutes = None
    if record.clock_out is not None:
        total_minutes = int((record.clock_out - record.clock_in).total_seconds() // 60)
        worked_minutes = max(0, total_minutes - (record.break_minutes or 0))
        overtime_minutes = max(0, worked_minutes - standard_work_minutes)

    interval_minutes_before = None
    interval_warning = None
    if previous_clock_out is not None:
        interval_minutes_before = int(
            (record.clock_in - previous_clock_out).total_seconds() // 60
        )
        interval_warning = interval_minutes_before < INTERVAL_MINIMUM_MINUTES

    return {
        "worked_minutes": worked_minutes,
        "overtime_minutes": overtime_minutes,
        "interval_minutes_before": interval_minutes_before,
        "interval_warning": interval_warning,
    }


def build_attendance_out_list(
    records: List[models.Attendance], standard_work_minutes: int
) -> List[schemas.AttendanceOut]:
    """日付順に並んだレコード群から、各レコードのインターバル等を計算してOutスキーマに変換"""
    results = []
    previous_clock_out: Optional[datetime] = None
    for record in records:
        metrics = compute_record_metrics(record, standard_work_minutes, previous_clock_out)
        out = schemas.AttendanceOut(
            id=record.id,
            user_id=record.user_id,
            work_date=record.work_date,
            clock_in=record.clock_in,
            clock_out=record.clock_out,
            break_minutes=record.break_minutes or 0,
            note=record.note,
            **metrics,
        )
        results.append(out)
        if record.clock_out is not None:
            previous_clock_out = record.clock_out
    return results


def build_monthly_summary(
    year: int, month: int, records_out: List[schemas.AttendanceOut]
) -> schemas.MonthlySummary:
    month_records = [r for r in records_out if r.work_date.year == year and r.work_date.month == month]
    total_worked = sum(r.worked_minutes or 0 for r in month_records)
    total_overtime = sum(r.overtime_minutes or 0 for r in month_records)
    intervals = [r.interval_minutes_before for r in month_records if r.interval_minutes_before is not None]
    warning_count = sum(1 for r in month_records if r.interval_warning)
    return schemas.MonthlySummary(
        year=year,
        month=month,
        total_worked_minutes=total_worked,
        total_overtime_minutes=total_overtime,
        record_count=len(month_records),
        min_interval_minutes=min(intervals) if intervals else None,
        interval_warning_count=warning_count,
    )
