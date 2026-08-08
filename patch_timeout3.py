import os

file_path = "src/components/ReportForm.tsx"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace('imageUrl = await withTimeout(uploadImageToCloudinary(image), 15000, "upload image to Cloudinary");', 'imageUrl = await uploadImageToCloudinary(image);')

with open(file_path, "w") as f:
    f.write(content)
