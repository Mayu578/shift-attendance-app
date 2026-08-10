from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud, schemas, security
from ..database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=schemas.Token)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = crud.get_user_by_email(db, user_in.email)
    if existing:
        raise HTTPException(status_code=400, detail="このメールアドレスは既に登録されています")

    hashed_password = security.get_password_hash(user_in.password)
    user = crud.create_user(db, user_in, hashed_password)

    access_token = security.create_access_token(data={"sub": str(user.id)})
    return schemas.Token(access_token=access_token, user=schemas.UserOut.model_validate(user))


@router.post("/login", response_model=schemas.Token)
def login(credentials: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, credentials.email)
    if not user or not security.verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="メールアドレスまたはパスワードが正しくありません",
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="アカウントが無効化されています")

    access_token = security.create_access_token(data={"sub": str(user.id)})
    return schemas.Token(access_token=access_token, user=schemas.UserOut.model_validate(user))


@router.get("/me", response_model=schemas.UserOut)
def read_me(current_user=Depends(security.get_current_user)):
    return current_user


@router.patch("/me/wage", response_model=schemas.UserOut)
def update_my_wage(
    data: schemas.UserUpdateWage,
    db: Session = Depends(get_db),
    current_user=Depends(security.get_current_user),
):
    return crud.update_user_wage(db, current_user, data.hourly_wage, data.overtime_hourly_wage)
