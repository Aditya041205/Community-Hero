import os
import sys

file_path = "src/App.tsx"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace('issues.filter(i => i?.status !== "Closed")', 'issues.filter(i => i?.status !== "Closed" && i?.status !== "Resolved" && i?.status !== "Archived")')

with open(file_path, "w") as f:
    f.write(content)
