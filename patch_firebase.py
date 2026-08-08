import os

file_path = "src/lib/firebase.ts"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace('import { getStorage } from "firebase/storage";\n', '')
content = content.replace('const storage = getStorage(app);\n', '')
content = content.replace('  storage,\n', '')

with open(file_path, "w") as f:
    f.write(content)
