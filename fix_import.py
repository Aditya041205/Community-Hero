import os

file_path = "src/components/ReportForm.tsx"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace('import { collection, addDoc } from "firebase/firestore";', 'import { collection, addDoc, updateDoc } from "firebase/firestore";')

with open(file_path, "w") as f:
    f.write(content)
