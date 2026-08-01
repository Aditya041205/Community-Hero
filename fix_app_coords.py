import os

file_path = "src/App.tsx"
with open(file_path, "r") as f:
    content = f.read()

target = """          latitude: data.location?.lat ?? data.latitude ?? 40.7500,
          longitude: data.location?.lng ?? data.longitude ?? -73.9800,"""
replacement = """          latitude: data.location?.lat ?? data.latitude,
          longitude: data.location?.lng ?? data.longitude,"""
content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)
