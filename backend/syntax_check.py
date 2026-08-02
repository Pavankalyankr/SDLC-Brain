import ast
import pathlib

files = list(pathlib.Path("app").rglob("*.py"))
errors = []

for p in files:
    try:
        ast.parse(p.read_text(encoding="utf-8", errors="ignore"))
    except SyntaxError as e:
        errors.append((str(p), str(e)))

print(f"Checked {len(files)} Python files")
if errors:
    print(f"\n❌ SYNTAX ERRORS ({len(errors)}):")
    for path, err in errors:
        print(f"  {path}: {err}")
else:
    print("✅ All files pass syntax check")
