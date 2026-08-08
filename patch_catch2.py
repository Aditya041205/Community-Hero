import os

file_path = "src/components/ReportForm.tsx"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace('      console.warn("Reverse geocoding failed");', '      console.error("Reverse geocoding failed", err);')

with open(file_path, "w") as f:
    f.write(content)
