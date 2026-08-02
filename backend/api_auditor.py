import json
import urllib.request
import urllib.error
import time

BASE_URL = "http://localhost:8000"

def request(method, path, data=None):
    url = f"{BASE_URL}{path}"
    headers = {}
    body = None
    if data:
        body = json.dumps(data).encode()
        headers['Content-Type'] = 'application/json'
    
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as res:
            return res.getcode(), json.loads(res.read().decode() or '{}')
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode()
        try:
            err_msg = json.loads(err_msg)
        except:
            pass
        return e.code, err_msg
    except Exception as e:
        return 0, str(e)

def main():
    print("=== SDLC Brain API Auditor ===\n")
    
    # 1. Create a dummy project
    print("[*] Creating a dummy project...")
    status, res = request("POST", "/api/v1/projects/", {"name": "Audit Test Project", "description": "Automated audit"})
    if status not in [200, 201]:
        print(f"Failed to create project. Status: {status} - {res}")
        return
    
    project_id = res.get("id")
    print(f"[+] Created Project: {project_id}\n")

    # Load OpenAPI
    with open("openapi.json") as f:
        schema = json.load(f)

    # 2. Find all GET endpoints
    get_endpoints = []
    for path, methods in schema.get("paths", {}).items():
        if "get" in methods:
            # We want endpoints that take project_id, or don't take any params (like /api/v1/projects/)
            # Skip stream endpoints, generate endpoints, single item endpoints for now unless we create the item
            if "{project_id}" in path and "stream" not in path:
                # We skip /{document_id} and others requiring secondary IDs for the initial scan
                if path.count("{") == 1: 
                    get_endpoints.append(path)
    
    get_endpoints.append("/api/v1/projects/")
    
    # Run the audit
    results = []
    print(f"[*] Auditing {len(get_endpoints)} endpoints...")
    
    for path in get_endpoints:
        actual_path = path.replace("{project_id}", project_id)
        status, response = request("GET", actual_path)
        
        status_str = f"[{status}]"
        if status == 200:
            print(f"  \033[92m{status_str}\033[0m GET {actual_path} -> OK")
            results.append({"path": actual_path, "status": status, "success": True})
        else:
            print(f"  \033[91m{status_str}\033[0m GET {actual_path} -> ERROR: {response}")
            results.append({"path": actual_path, "status": status, "success": False, "error": response})
            
    # Cleanup
    print("\n[*] Cleaning up dummy project...")
    status, res = request("DELETE", f"/api/v1/projects/{project_id}")
    if status == 200 or status == 204:
        print("[+] Project deleted successfully.")
    else:
        print(f"[-] Failed to delete project: {status} - {res}")

    print("\n=== Audit Summary ===")
    failures = [r for r in results if not r['success']]
    print(f"Total: {len(results)}, Passed: {len(results)-len(failures)}, Failed: {len(failures)}")
    if failures:
        print("\nFailures:")
        for f in failures:
            print(f" - {f['path']}: HTTP {f['status']} -> {f['error']}")

if __name__ == "__main__":
    main()
