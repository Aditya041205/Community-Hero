import os
import re

file_path = "server.ts"
with open(file_path, "r") as f:
    content = f.read()

# We want to remove dummy_issues array completely. It starts at `const dummy_issues = [` and ends at `  }\n];`
content = re.sub(r'const dummy_issues = \[.*?\];', '', content, flags=re.DOTALL)

with open(file_path, "w") as f:
    f.write(content)
