from __future__ import annotations

import os
from pathlib import Path

os.environ["GHOSTSOC_ENV"] = "test"
os.environ["GHOSTSOC_DATABASE_URL"] = "sqlite:///./test-ghostsoc.db"
os.environ["GHOSTSOC_SECRET_KEY"] = "test-secret-key-with-at-least-32-characters"  # noqa: S105
os.environ["GHOSTSOC_BOOTSTRAP_ADMIN_PASSWORD"] = "test-administrator-password"  # noqa: S105
os.environ["GHOSTSOC_DEMO_MODE"] = "true"
os.environ["GHOSTSOC_DRY_RUN"] = "true"
os.environ["GHOSTSOC_AUTHORIZED_TARGETS"] = "demo-endpoint-01,demo-endpoint-02"
os.environ["GHOSTSOC_REPORT_DIR"] = "./test-reports"
os.environ["GHOSTSOC_OPENSEARCH_URL"] = ""
Path("test-ghostsoc.db").unlink(missing_ok=True)

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core.database import Base, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest.fixture(autouse=True)
def clean_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    report_dir = Path("test-reports")
    if report_dir.exists():
        for path in report_dir.iterdir():
            path.unlink()
        report_dir.rmdir()


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def auth(client: TestClient) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@ghostsoc.local", "password": "test-administrator-password"},
    )
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def demo_event() -> dict[str, object]:
    return {
        "event_id": "test-sysmon-001",
        "timestamp": "2026-08-17T09:30:00Z",
        "source": "pytest-fixture",
        "source_type": "sysmon",
        "host": "demo-endpoint-01",
        "user": "LAB\\analyst",
        "process": "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
        "parent_process": "C:\\Windows\\explorer.exe",
        "command_line": "powershell.exe -EncodedCommand ZABlAG0AbwA=",
        "src_ip": "10.10.0.15",
        "dst_ip": "198.51.100.42",
        "domain": "controlled-demo.invalid",
        "url": "https://controlled-demo.invalid/payload",
        "hash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "file": "C:\\Lab\\controlled-demo.ps1",
        "event_type": "process_creation",
        "severity": "HIGH",
        "raw_reference": "fixture:pytest",
        "metadata": {"authorized_simulation": True},
    }
