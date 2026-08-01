import os

file_path = "src/App.tsx"
with open(file_path, "r") as f:
    content = f.read()

target1 = """{issues.filter(i => i?.status !== "Closed" && i?.status !== "Resolved" && i?.status !== "Archived").length === 0 ? ("""
replacement1 = """{issues.filter(i => i?.status !== "Archived").length === 0 ? ("""
content = content.replace(target1, replacement1)

target2 = """issues={issues.filter(i => i?.status !== "Closed" && i?.status !== "Resolved" && i?.status !== "Archived")}"""
replacement2 = """issues={issues.filter(i => i?.status !== "Archived")}"""
content = content.replace(target2, replacement2)

with open(file_path, "w") as f:
    f.write(content)
