import os

file_path = "src/components/InteractiveMap.tsx"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace("setZoom(15);", "setZoom(17);")

with open(file_path, "w") as f:
    f.write(content)
