import os

file_path = "src/components/ReportForm.tsx"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace("let uploadedUrl: string | null = null;", "let imageUrl: string | null = null;")
content = content.replace("uploadedUrl =", "imageUrl =")
content = content.replace("uploadedUrl)", "imageUrl)")
content = content.replace("!uploadedUrl", "!imageUrl")
content = content.replace("imageUrl: uploadedUrl,", "imageUrl: imageUrl,")
content = content.replace("image: uploadedUrl,", "")
content = content.replace("imageUrl: uploadedUrl", "imageUrl")
content = content.replace("image: uploadedUrl", "")

with open(file_path, "w") as f:
    f.write(content)
