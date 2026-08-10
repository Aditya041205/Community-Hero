import os

file_path = "server.ts"
with open(file_path, "r") as f:
    content = f.read()

target = """    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "a1g8nbso";
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || "civic_action";"""

replacement = """    const cloudName = "a1g8nbso";
    const uploadPreset = "civic_action";"""

content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)
