from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, schemas, models, security
from ..database import get_db

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[schemas.UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(security.get_current_admin),
):
    return crud.list_users(db)


@router.patch("/{user_id}/role", response_model=schemas.UserOut)
def update_role(
    user_id: int,
    data: schemas.UserUpdateRole,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(security.get_current_admin),
):
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="ユーザーが見つかりません")
    return crud.update_user_role(db, user, data.role)


@router.patch("/{user_id}/active", response_model=schemas.UserOut)
def update_active(
    user_id: int,
    data: schemas.UserUpdateActive,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(security.get_current_admin),
):
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="ユーザーが見つかりません")
    if user.id == current_admin.id and not data.is_active:
        raise HTTPException(status_code=400, detail="自分自身を無効化することはできません")
    return crud.update_user_active(db, user, data.is_active)


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(security.get_current_admin),
):
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="ユーザーが見つかりません")
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="自分自身を削除することはできません")
    crud.delete_user(db, user)
    return {"ok": True}
