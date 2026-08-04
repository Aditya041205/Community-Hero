import os

file_path = "src/App.tsx"
with open(file_path, "r") as f:
    content = f.read()

target = """        const complaintImage = data.imageUrl || data.imageURL || data.photoUrl || data.photo || data.image || data.evidenceImageUrl || data.evidenceImage || data.fileUrl || "";"""
replacement = """        const complaintImage = data.imageUrl || data.imageURL || data.photoUrl || data.photo || data.image || data.evidenceImageUrl || data.evidenceImage || data.fileUrl || data.attachment || "";"""

content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)
