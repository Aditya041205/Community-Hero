import os

file_path = "src/App.tsx"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace('} Plus, AlertCircle } from "lucide-react";', ', Plus, AlertCircle } from "lucide-react";')

with open(file_path, "w") as f:
    f.write(content)
