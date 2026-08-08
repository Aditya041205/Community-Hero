import os

file_path = "src/components/ReportForm.tsx"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace('await withTimeout(addDoc(collection(db, "complaints"), firestoreData), 10000, "addDoc");', 'await withTimeout(addDoc(collection(db, "complaints"), firestoreData), 3000, "addDoc");')

with open(file_path, "w") as f:
    f.write(content)
