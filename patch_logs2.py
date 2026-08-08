import os

file_path = "src/components/ReportForm.tsx"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace('console.time("upload image");', 'console.time("Cloudinary Upload");')
content = content.replace('console.timeEnd("upload image");', 'console.timeEnd("Cloudinary Upload");')
content = content.replace('console.time("addDoc()");', 'console.time("Firestore Complaint Save");')
content = content.replace('console.timeEnd("addDoc()");', 'console.timeEnd("Firestore Complaint Save");')

with open(file_path, "w") as f:
    f.write(content)
