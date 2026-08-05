import asyncio
from app.ai.orchestrator.orchestrator import orchestrator

async def main():
    result = await orchestrator.generate(
        task_type='development',
        messages=[{'role': 'user', 'content': 'explain frontend code that is written'}],
        project_id='09dad52c-866f-4de4-b041-2d91a9893678',
        task_id='test1234',
        system_prompt='Respond strictly with JSON object: { "chat_message": "response", "files": [] }',
        json_mode=True
    )
    print('RAW RESULT:')
    print(repr(result))

if __name__ == "__main__":
    asyncio.run(main())
