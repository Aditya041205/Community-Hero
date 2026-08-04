import os

file_path = "src/components/ReportForm.tsx"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace(
    'import { ref, uploadString, getDownloadURL } from "firebase/storage";',
    'import { ref, uploadString, getDownloadURL, uploadBytes } from "firebase/storage";'
)

content = content.replace(
    '          const { uploadBytes } = await import("firebase/storage");\n',
    ''
)

with open(file_path, "w") as f:
    f.write(content)
