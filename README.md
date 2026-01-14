# Land Registry Documentation

![Python](https://img.shields.io/badge/language-Python-blue.svg)
![FastAPI](https://img.shields.io/badge/framework-FastAPI-teal.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

Welcome to the comprehensive documentation for the **Land Registry Management Platform**.  
This project is a **production-grade, full-stack web application** built using **FastAPI** for a high-performance backend and **Vanilla JavaScript** with **Jinja2 templates** for a lightweight and efficient frontend.

The application focuses on **document management for land registry (Κτηματολόγιο) records**, including **image and PDF uploads**, metadata handling, and secure user interaction.

This document serves as a **complete technical reference** for developers, reviewers, and contributors.

---

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

## 📄 License

MIT License

---

**Author**  
Nikolaos Galanakis  
https://github.com/nikogalanakis
