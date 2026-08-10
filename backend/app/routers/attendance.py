from typing import Optional
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, schemas, models, security
from ..database import get_db

router = APIRouter(prefix="/attendance", tags=["attendance"])


def _ensure_owner_or_admin(record: models.Attendance, current_user: models.User):
    if record.user_id != current_user.id and current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="この記録を操作する権限がありません")


@router.post("", response_model=schemas.AttendanceOut)
def create_attendance(
    data: schemas.AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    record = crud.create_attendance(db, current_user.id, data)
    all_records = crud.list_attendances_for_user_around(db, current_user.id)
    out_list = crud.build_attendance_out_list(all_records, current_user.hourly_wage, current_user.overtime_hourly_wage)
    return next(r for r in out_list if r.id == record.id)


@router.get("", response_model=schemas.AttendanceListResponse)
def list_my_attendance(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    # インターバル計算のため月をまたいで直近レコードも含めて計算し、対象月だけ返す
    all_records = crud.list_attendances_for_user_around(db, current_user.id)
    out_list = crud.build_attendance_out_list(all_records, current_user.hourly_wage, current_user.overtime_hourly_wage)
    month_records = [r for r in out_list if r.work_date.year == year and r.work_date.month == month]
    summary = crud.build_monthly_summary(year, month, out_list)
    return schemas.AttendanceListResponse(records=month_records, summary=summary)


@router.put("/{record_id}", response_model=schemas.AttendanceOut)
def update_attendance(
    record_id: int,
    data: schemas.AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    record = crud.get_attendance(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="記録が見つかりません")
    _ensure_owner_or_admin(record, current_user)

    updated = crud.update_attendance(db, record, data)
    owner = crud.get_user(db, updated.user_id)
    all_records = crud.list_attendances_for_user_around(db, updated.user_id)
    out_list = crud.build_attendance_out_list(all_records, owner.hourly_wage, owner.overtime_hourly_wage)
    return next(r for r in out_list if r.id == updated.id)


@router.delete("/{record_id}")
def delete_attendance(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    record = crud.get_attendance(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="記録が見つかりません")
    _ensure_owner_or_admin(record, current_user)
    crud.delete_attendance(db, record)
    return {"ok": True}


# ---------- 管理者用: 全員の勤怠閲覧 ----------

@router.get("/admin/all", response_model=dict)
def list_all_attendance(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(security.get_current_admin),
):
    users = crud.list_users(db)
    result = {}
    for user in users:
        all_records = crud.list_attendances_for_user_around(db, user.id)
        out_list = crud.build_attendance_out_list(all_records, user.hourly_wage, user.overtime_hourly_wage)
        month_records = [r for r in out_list if r.work_date.year == year and r.work_date.month == month]
        summary = crud.build_monthly_summary(year, month, out_list)
        result[user.id] = schemas.AttendanceListResponse(records=month_records, summary=summary)
    return {
        "users": [schemas.UserOut.model_validate(u) for u in users],
        "data": result,
    }
