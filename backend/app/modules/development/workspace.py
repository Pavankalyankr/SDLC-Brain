import os
from pathlib import Path

import aiofiles
from fastapi import HTTPException


class WorkspaceManager:
    def __init__(self, base_dir: str = "/app/workspace"):
        self.base_dir = Path(base_dir)

    def _get_project_dir(self, project_id: str) -> Path:
        project_dir = self.base_dir / project_id
        project_dir.mkdir(parents=True, exist_ok=True)
        return project_dir

    def _safe_path(self, project_id: str, relative_path: str) -> Path:
        project_dir = self._get_project_dir(project_id).resolve()
        target_path = (project_dir / relative_path).resolve()

        # Ensure the target path is within the project directory to prevent path traversal
        if not str(target_path).startswith(str(project_dir)):
            raise HTTPException(status_code=403, detail="Access denied")

        return target_path

    async def list_files(self, project_id: str) -> list[dict]:
        project_dir = self._get_project_dir(project_id)
        files = []
        for root, dirs, filenames in os.walk(project_dir):
            # Skip hidden directories and empty legacy system folders
            valid_dirs = []
            for d in dirs:
                if d.startswith('.') or d in ["__MACOSX", "__pycache__", "node_modules"]:
                    continue
                if d in ["generated", "repository", "uploads", "artifacts", "exports"]:
                    dir_full_path = Path(root) / d
                    try:
                        if not any(dir_full_path.iterdir()):
                            continue
                    except Exception:
                        pass
                valid_dirs.append(d)
            dirs[:] = valid_dirs
            for filename in filenames:
                if filename == ".DS_Store" or filename.startswith("._") or filename.endswith(".pyc"):
                    continue
                file_path = Path(root) / filename
                rel_path = file_path.relative_to(project_dir)
                files.append({
                    "path": str(rel_path).replace("\\", "/"),
                    "name": filename,
                    "is_dir": False
                })
            for d in dirs:
                dir_path = Path(root) / d
                rel_path = dir_path.relative_to(project_dir)
                files.append({
                    "path": str(rel_path).replace("\\", "/"),
                    "name": d,
                    "is_dir": True
                })
        return files

    async def read_file(self, project_id: str, file_path: str) -> str:
        target_path = self._safe_path(project_id, file_path)
        if not target_path.exists() or not target_path.is_file():
            raise HTTPException(status_code=404, detail="File not found")

        async with aiofiles.open(target_path, encoding='utf-8') as f:
            return await f.read()

    async def write_file(self, project_id: str, file_path: str, content: str):
        target_path = self._safe_path(project_id, file_path)
        target_path.parent.mkdir(parents=True, exist_ok=True)

        async with aiofiles.open(target_path, mode='w', encoding='utf-8') as f:
            await f.write(content)

    async def delete_file(self, project_id: str, file_path: str):
        target_path = self._safe_path(project_id, file_path)
        if target_path.exists():
            if target_path.is_file():
                target_path.unlink()
            elif target_path.is_dir():
                import shutil
                shutil.rmtree(target_path)

workspace_manager = WorkspaceManager()
