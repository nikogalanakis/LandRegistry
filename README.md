# Land Registry Documentation

<<<<<<< HEAD
## Overview

**LandRegistry** is a FastAPI-based web application designed to manage land registry records with support for document (PDF) upload, storage, and retrieval.  
The system is intended to provide a lightweight backend service that can be extended for property ownership records, legal documentation, and land-related metadata.

This project is a production-grade, full-stack application built using **FastAPI** for the high-performance backend and **Vanilla JavaScript** for a lightweight, dependency-free frontend.

## Features

- FastAPI backend with RESTful endpoints
- Upload and store PDF documents
- Serve and display uploaded PDFs
- Modular project structure
- Integration with SQLite
- Suitable for integration with frontend frameworks
=======
![Python](https://img.shields.io/badge/language-Python-blue.svg)
![FastAPI](https://img.shields.io/badge/framework-FastAPI-teal.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

Welcome to the comprehensive documentation for the **Land Registry Management Platform**.  
This project is a **production-grade, full-stack web application** built using **FastAPI** for a high-performance backend and **Vanilla JavaScript** with **Jinja2 templates** for a lightweight and efficient frontend.

The application focuses on **document management for land registry (Κτηματολόγιο) records**, including **image and PDF uploads**, metadata handling, and secure user interaction.

This document serves as a **complete technical reference** for developers, reviewers, and contributors.
>>>>>>> ad7df74d9bb262b7bbe4703825895b4faa66311d


## 📚 Table of Contents

1. Project Overview  
2. Technology Stack  
3. Project Directory Structure  
4. Installation & Setup  
5. Configuration  
6. Database Schema  
7. Application Architecture  
8. API Reference  
9. Frontend Documentation  
10. Troubleshooting  
11. License  

---

## 🚀 Project Overview

The **Land Registry Platform** is designed with a strict **separation of concerns**, scalability, and maintainability in mind.

### Core Capabilities

- Secure user authentication  
- Upload and storage of **PDF and image documents**  
- Association of documents with land registry records  
- Retrieval and viewing of stored documents  
- RESTful API with clear contracts  

---

## 🛠 Technology Stack

### Backend Core
- Python 3.8+
- FastAPI
- Uvicorn
- Jinja2

### Database & ORM
- SQLite
- aiosqlite
- SQLAlchemy (async)

### Authentication & Security
- JWT (python-jose)
- Password hashing (passlib + bcrypt)
- File uploads (python-multipart)

### Frontend
- HTML5, CSS3, ES6+ JavaScript
- Vanilla JS only

---

## 📂 Project Directory Structure

```
LandRegistry/
├── backend/
│   ├── auth/
│   ├── core/
│   ├── registry/
│   ├── main.py
│   ├── sql_app.db
│   └── .env
├── frontend/
│   ├── static/
│   └── templates/
├── uploads/
├── requirements.txt
└── README.md
```

---

## 📥 Installation & Setup

```bash
git clone https://github.com/nikogalanakis/LandRegistry.git
cd LandRegistry
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd backend
uvicorn main:app --reload
```

---

## ⚙️ Configuration

Create a `.env` file in `backend/`:

```ini
SECRET_KEY=change_this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
DATABASE_URL=sqlite+aiosqlite:///./sql_app.db
UPLOAD_DIR=../uploads
```

---

## 🗄 Database Schema

- Users
- Registry Records
- Documents

---

<<<<<<< HEAD
## 🏗 Application Architecture

### Backend Architecture
The backend is structured using the **Router Pattern**.
- **AuthRouter**: Handles `/auth/*` -> `auth/router.py`
- **PostsRouter**: Handles `/posts/*` -> `posts/router.py`
- **CommentsRouter**: Handles `/comments/*` -> `comments/router.py`
- **LikesRouter**: Handles `/likes/*` -> `likes/router.py`

**Data Flow**:
1. **Request** hits `main.py`.
2. **FastAPI** routes to the specific module router.
3. **Dependency Injection** (`Depends(get_db)`) provides an Async Database Session.
4. **Router** calls SQLAlchemy to query/mutate data.
5. **Pydantic Models** (`schemas.py`) validate and serialize the response.
6. **JSON Response** is sent back.

### Frontend Architecture
The frontend uses a **Hybrid Templating + SPA** approach.

1. **Initial Load**:
    - The server renders `base.html` + `page.html` using Jinja2.
    - This provides fast "First Contentful Paint".
2. **Dynamic Data**:
    - Once loaded, JavaScript modules (`feed.js`, etc.) fetch data via JSON APIs.
    - They manipulate the DOM to insert Posts, Comments, and Likes.
3. **State Management**:
    - `api.js` manages the JWT token in `localStorage`.
    - Local state (like "isLiked") is handled simplistically in the DOM or JS variables.

---

## 📖 API Reference

### Authentication

#### Register a new user
**Endpoint**: `POST /api/auth/register`

- **Request Body** (JSON):
    ```json
    {
        "email": "user@example.com",
        "username": "cooluser123", /* Optional */
        "password": "securepassword"
    }
    ```
- **Response** (201 Created):
    ```json
    {
        "id": 1,
        "email": "user@example.com",
        "username": "cooluser123",
        "profile_picture_url": null,
        "created_at": "2023-10-27T10:00:00"
    }
    ```

#### Login
**Endpoint**: `POST /api/auth/login`

- **Request Body** (JSON):
    ```json
    {
        "email": "user@example.com",
        "password": "securepassword"
    }
    ```
- **Response** (200 OK):
    ```json
    {
        "access_token": "eyJhbGciOiJIUzI1Ni...",
        "token_type": "bearer"
    }
    ```

#### Update Profile
**Endpoint**: `PUT /api/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body** (FormData):
    - `username`: (Text, Optional)
    - `profile_picture`: (File, Optional)
- **Response** (200 OK): Returns updated User object.

---

### Posts

#### Create Post
**Endpoint**: `POST /api/posts/`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body** (FormData):
    - `title`: "My new photo"
    - `image`: (Binary File)
- **Response** (201 Created):
    ```json
    {
        "id": 5,
        "title": "My new photo",
        "image_url": "/uploads/uuid.png",
        "user_id": 1,
        "created_at": "...",
        "user": { ...UserObj... }
    }
    ```

#### Get Feed
**Endpoint**: `GET /api/posts/`
- **Query Params**:
    - `skip`: (int) default 0
    - `limit`: (int) default 100
- **Response** (200 OK): List of Post objects.

---

### Interactions

#### Toggle Like
**Endpoint**: `POST /api/likes/{post_id}`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
    ```json
    {
        "liked": true,
        "count": 42
    }
    ```

#### Add Comment
**Endpoint**: `POST /api/comments/{post_id}`
- **Request Body**:
    ```json
    { "text": "Great post!" }
    ```
- **Response**: Comment object with User details.

---

## 💻 Frontend Documentation

### `static/js/api.js`
This is the core network utility for the application.

- **`apiFetch(endpoint, options)`**: 
    - A wrapper around the native `fetch` API.
    - Automatically injects the `Authorization` header if a token exists in `localStorage`.
    - Handles 401 (Unauthorized) errors by redirecting to `/login`.
    - Returns the native Promise.

### `static/js/feed.js`
Handles the main feed logic.

- **`loadFeed()`**: Fetches posts from `/api/posts/` and clears the loader.
- **`createPostElement(post)`**: Generates the HTML card for a post. It handles escaping HTML to prevent XSS.
- **`toggleLike(postId)`**: Implements **Optimistic UI**. It updates the heart icon and number immediately before the server responds, providing a snappy experience. If the server fails, it reverts the change.

### `static/js/auth.js`
Manages User Sessions.

- Listens for form submissions on Login and Register pages.
- Stores the received JWT in `localStorage`.
- Redirects users upon success.

---

## ❓ Troubleshooting

### 1. "No such column: users.username"
**Cause**: The database file `sql_app.db` was created before the "User Profile" update and has an old schema.
**Solution**:
1. Stop the server `CTRL+C`.
2. Delete the file `backend/sql_app.db`.
3. Restart the server. It will recreate the DB with the new columns.

### 2. Images not loading
**Cause**: The static mount path might be incorrect or the file doesn't exist.
**Solution**:
- Ensure the `uploads/` directory exists in the project root.
- The path stored in the DB is relative (`/uploads/...`).
- `main.py` mounts this directory to serve files.

### 3. Changes not reflecting (Frontend)
**Cause**: Browser caching JavaScript files.
**Solution**:
- We implement cache busting via `?v=3` in the HTML templates.
- If issues persist, perform a **Hard Reload**:
    - Windows: `Ctrl + F5`
    - Mac: `Cmd + Shift + R`

### 4. `AttributeError: type object 'Post' has no attribute 'user'`
**Cause**: A mismatch between the SQLAlchemy Relationship name and the code using it.
**Solution**:
- This was strictly fixed in `posts/models.py`.
- Ensure the relationship is defined as:
  ```python
  user = relationship("auth.models.User")
  ```
  (It was previously named `owner`).

---

## Simple Steps

1. git clone https://github.com/pmoschos/Land Registry.git
2. cd Land Registry
3. python -m venv venv
4. venv\Scripts\activate
5. pip install -r requirements.txt
6. cd backend
7. uvicorn main:app --reload --host 0.0.0.0 --port 8000

Open browser: http://0.0.0.0:8000 

## 📢 Stay Updated

Be sure to ⭐ this repository to stay updated with new examples and enhancements!

=======
>>>>>>> ad7df74d9bb262b7bbe4703825895b4faa66311d
## 📄 License

MIT License

---

**Author**  
Nikolaos Galanakis  
https://github.com/nikogalanakis
