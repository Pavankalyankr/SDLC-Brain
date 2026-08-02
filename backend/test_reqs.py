import urllib.request
import json
import urllib.error

try:
    req = urllib.request.Request("http://localhost:8000/api/v1/agile/requirements/09dad52c-866f-4de4-b041-2d91a9893678")
    with urllib.request.urlopen(req) as response:
        res = json.loads(response.read().decode())
        print(f"Generated Requirements: {len(res)}")
        if res:
            print(res[0]['title'])
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code} - {e.read().decode()}")
except Exception as e:
    print(f"Error: {e}")
