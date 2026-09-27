"""Isolated application database for API tests (including the startup lifespan)."""

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

import app.models  # noqa: F401 - register models
from app.core.database import Base, SessionLocal, get_db
from app.main import app


@pytest.fixture
def db_session(tmp_path, monkeypatch):
    engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    SessionLocal.configure(bind=engine)
    from app.core.config import get_settings

    settings = get_settings()
    monkeypatch.setattr(settings, "report_dir", tmp_path / "reports")
    monkeypatch.setattr(settings, "bootstrap_admin_password", "test-administrator-password")
    try:
        with SessionLocal() as session:
            yield session
    finally:
        engine.dispose()


@pytest.fixture
def client(db_session: Session):
    def override():
        db_session.expire_all()
        yield db_session

    app.dependency_overrides[get_db] = override
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()


@pytest.fixture
def auth(client: TestClient):
    response = client.post("/api/v1/auth/login", json={
        "email": "admin@ghostsoc.local", "password": "test-administrator-password"
    })
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def demo_event():
    data = json.loads((Path(__file__).resolve().parents[2] / "demo/powershell-event.json").read_text())
    data["raw_reference"] = "fixture:pytest"
    return data
