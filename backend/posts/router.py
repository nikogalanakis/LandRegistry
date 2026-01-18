import os
import shutil
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from core.database import get_db
from auth.router import get_current_user
from auth.models import User
from posts.models import Post
from posts.schemas import PostResponse, PostUpdate

router = APIRouter(prefix="/posts", tags=["posts"])

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    title: str = Form(...),
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Safe filename generation
    file_extension = image.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    # Validate file type
    ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "pdf"}
    if file_extension.lower() not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only images (jpg, jpeg, png, gif) and PDFs are allowed."
        )

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    # Create DB entry
    image_url = f"/uploads/{filename}"

    new_post = Post(title=title, image_url=image_url, user_id=current_user.id)
    db.add(new_post)
    await db.commit()
    await db.refresh(new_post)
    new_post.user = current_user
    return new_post

@router.get("/", response_model=List[PostResponse])
async def get_posts(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Post)
        .options(selectinload(Post.user))
        .order_by(Post.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    posts = result.scalars().all()
    return posts

@router.put("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: int,
    post_data: PostUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a post. Only the post owner can update their post.
    Only the title can be edited (not the image).
    """
    result = await db.execute(
        select(Post)
        .options(selectinload(Post.user))
        .where(Post.id == post_id)
    )
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own posts"
        )

    post.title = post_data.title
    await db.commit()
    await db.refresh(post)
    return post

@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a post. Only the post owner can delete their post.
    This will also cascade delete all related comments and likes.
    """
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own posts"
        )

    # Delete the image/PDF file from disk
    if post.image_url:
        image_path = post.image_url.lstrip("/")  # "uploads/filename.ext"
        if os.path.exists(image_path):
            try:
                os.remove(image_path)
            except OSError:
                pass

    await db.delete(post)
    await db.commit()
    return None
