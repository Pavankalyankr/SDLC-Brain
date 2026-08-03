import asyncio
import logging
import os
import uuid

logger = logging.getLogger(__name__)

class TerminalSession:
    def __init__(self, project_id: str):
        self.id = uuid.uuid4().hex[:8]
        self.project_id = project_id
        self.process = None
        self.workspace_dir = f"/app/workspace/{project_id}"
        os.makedirs(self.workspace_dir, exist_ok=True)

    async def start(self):
        # Start a bash shell process
        # Using environment variables to force colors in some tools
        env = os.environ.copy()
        env["FORCE_COLOR"] = "1"
        env["TERM"] = "xterm-256color"

        self.process = await asyncio.create_subprocess_exec(
            "bash",
            cwd=self.workspace_dir,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            env=env
        )
        logger.info(f"Started terminal session {self.id} for project {self.project_id}")

    async def write(self, data: str):
        if self.process and self.process.stdin:
            self.process.stdin.write(data.encode('utf-8'))
            await self.process.stdin.drain()

    async def read(self, n=4096) -> bytes:
        if self.process and self.process.stdout:
            try:
                return await self.process.stdout.read(n)
            except Exception as e:
                logger.error(f"Error reading from terminal stdout: {e}")
                return b""
        return b""

    def stop(self):
        if self.process:
            try:
                self.process.terminate()
            except ProcessLookupError:
                pass

class TerminalManager:
    def __init__(self):
        self.sessions: dict[str, TerminalSession] = {}

    async def create_session(self, project_id: str) -> TerminalSession:
        session = TerminalSession(project_id)
        await session.start()
        self.sessions[session.id] = session
        return session

    def get_session(self, session_id: str) -> TerminalSession | None:
        return self.sessions.get(session_id)

    def cleanup(self, session_id: str):
        session = self.sessions.pop(session_id, None)
        if session:
            session.stop()

terminal_manager = TerminalManager()
