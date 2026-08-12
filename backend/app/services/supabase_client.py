import os
from pathlib import Path
from supabase import create_client, Client

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = BACKEND_DIR / ".env"


def load_env_file(path: Path) -> dict:
    """
    Manual .env loader that's tolerant of a UTF-8 BOM -- Windows tools
    (PowerShell's Out-File, some editors) commonly prepend one, and
    python-dotenv's default reader doesn't strip it, causing keys to
    silently fail to match (e.g. 'SUPABASE_URL' becomes invisible).
    """
    env_vars = {}
    if not path.exists():
        return env_vars

    with open(path, "r", encoding="utf-8-sig") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            env_vars[key.strip()] = value.strip()
    return env_vars


env_vars = load_env_file(ENV_PATH)

SUPABASE_URL = env_vars.get("SUPABASE_URL") or os.environ.get("SUPABASE_URL")
SUPABASE_KEY = env_vars.get("SUPABASE_KEY") or os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError(
        f"SUPABASE_URL and SUPABASE_KEY must be set in {ENV_PATH}. "
        f"File exists: {ENV_PATH.exists()}. Keys found in file: {list(env_vars.keys())}"
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)