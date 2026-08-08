import os

file_path = "src/components/ReportForm.tsx"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace('console.time("Image Upload")', 'console.time("upload image")')
content = content.replace('console.timeEnd("Image Upload")', 'console.timeEnd("upload image")')

content = content.replace('console.time("addDoc")', 'console.time("addDoc()")')
content = content.replace('console.timeEnd("addDoc")', 'console.timeEnd("addDoc()")')

content = content.replace('console.time("updateDoc")', 'console.time("updateDoc()")')
content = content.replace('console.timeEnd("updateDoc")', 'console.timeEnd("updateDoc()")')

content = content.replace('console.time("navigate")', 'console.time("navigate()")')
content = content.replace('console.timeEnd("navigate")', 'console.timeEnd("navigate()")')

with open(file_path, "w") as f:
    f.write(content)
