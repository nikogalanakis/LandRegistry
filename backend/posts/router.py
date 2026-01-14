import os
import shutil
import uuid
from typing import List
from comments.models import Comment
from likes.models import Like
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from core.database import get_db
from auth.router import get_current_user
from auth.models import User
from posts.models import Post
from posts.schemas import PostResponse

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

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    
    # Create DB entry
    # URL structure: /static/uploads/filename
    # We will mount static files in main.py
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
# This was added to delete the post from the database and the image from the uploads folder
#  starting with the comments and likes associated with the post
@router.delete("/{post_id}/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    
    if post.user_id != current_user.id:
     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this post")
    
    # Delete the image file
    image_path = post.image_url.lstrip("/")
    if os.path.exists(image_path):
        os.remove(image_path)
    
    # Delete associated comments and likes
    result = await db.execute(select(Comment).where(Comment.post_id == post_id))
    comments = result.scalars().all()
    
    # Delete the comments from the database
    for comment in comments:
        await db.delete(comment)

    result = await db.execute(select(Like).where(Like.post_id == post_id))
    likes = result.scalars().all()

    # Delete the likes from the database
    for like in likes:
        await db.delete(like)

    # Delete the post from the database
    await db.delete(post)
    await db.commit()
    
    return
