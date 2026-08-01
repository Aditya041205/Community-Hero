import os

file_path = "src/types.ts"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace("  latitude: number;", "  latitude?: number;")
content = content.replace("  longitude: number;", "  longitude?: number;")

with open(file_path, "w") as f:
    f.write(content)
