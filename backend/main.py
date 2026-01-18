import os
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from core.database import engine, Base
from auth import router as auth_router, models as auth_models
from posts import router as posts_router, models as posts_models
from comments import router as comments_router, models as comments_models
from likes import router as likes_router, models as likes_models

# Create tables on startup
async def init_models():
    async with engine.begin() as conn:
    #    await conn.run_sync(Base.metadata.drop_all)  # UNCOMMENT TO RESET DB
        await conn.run_sync(Base.metadata.create_all)

app = FastAPI(title="Land Registry", on_startup=[init_models])

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(auth_router.router, prefix="/api")
app.include_router(posts_router.router, prefix="/api")
app.include_router(comments_router.router, prefix="/api")
app.include_router(likes_router.router, prefix="/api")

# Static Files
if not os.path.exists("uploads"):
    os.makedirs("uploads")

# Mount frontend static files
app.mount("/static", StaticFiles(directory="../frontend/static"), name="static")

# Mount uploads (images + PDFs)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Templates
templates = Jinja2Templates(directory="../frontend/templates")

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("feed.html", {"request": request})

@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/register", response_class=HTMLResponse)
async def register_page(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})

@app.get("/create", response_class=HTMLResponse)
async def create_post_page(request: Request):
    return templates.TemplateResponse("create_post.html", {"request": request})

@app.get("/profile", response_class=HTMLResponse)
async def profile_page(request: Request):
    return templates.TemplateResponse("profile.html", {"request": request})
