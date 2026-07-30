import os
import re

modules = ["qa", "development", "code_review", "devops", "production"]
base_dir = r"c:\Users\pavan\OneDrive\Desktop\SDLC_Brain\backend\app\modules"

for module in modules:
    service_file = os.path.join(base_dir, module, "service.py")
    if not os.path.exists(service_file):
        continue
        
    with open(service_file, "r") as f:
        content = f.read()
        
    # Add imports if missing
    if "from app.core.events import EventType, SSEEvent" not in content and "from app.core.events import SSEEvent, EventType" not in content:
        content = content.replace("from app.core.events import event_manager", "from app.core.events import event_manager, EventType, SSEEvent")
        
    # Replace dicts in publish with SSEEvent
    # await event_manager.publish(task_id, {"type": "status", "message": "...", "progress": 10})
    # -> await event_manager.publish(task_id, SSEEvent(event_type=EventType.TASK_STATUS, data={"message": "...", "progress": 10}))
    
    # Simple regex to catch the pattern
    # The dictionary looks like: {"type": "status", "message": "...", "progress": ...}
    # Wait, some have "status": "complete"
    # Or {"type": "data", "action": "reload", "target": "..."}
    
    # We can just match the dict directly
    content = re.sub(
        r'await event_manager\.publish\(\s*task_id,\s*(\{"type": "status",.*?)\s*\)',
        r'await event_manager.publish(task_id, SSEEvent(event_type=EventType.TASK_STATUS, data=\1))',
        content,
        flags=re.DOTALL
    )
    
    content = re.sub(
        r'await event_manager\.publish\(\s*task_id,\s*(\{"type": "data",.*?)\s*\)',
        r'await event_manager.publish(task_id, SSEEvent(event_type=EventType.ARTIFACT_UPDATED, data=\1))',
        content,
        flags=re.DOTALL
    )

    with open(service_file, "w") as f:
        f.write(content)

print("Fixed service files.")
