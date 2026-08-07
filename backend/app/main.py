import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .database import engine
from .routers import auth, attendance, users

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="グランドスタッフ勤怠管理API")

# ALLOWED_ORIGINS環境変数にカンマ区切りでVercelのURL等を追加する
# 例: https://your-app.vercel.app,https://your-app-git-main.vercel.app
extra_origins = os.environ.get("ALLOWED_ORIGINS", "")
allow_origins = ["http://localhost:5173"] + [
    o.strip() for o in extra_origins.split(",") if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(attendance.router)
app.include_router(users.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "attendance-api"}
