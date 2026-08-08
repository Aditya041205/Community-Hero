import os

file_path = "src/components/ReportForm.tsx"
with open(file_path, "r") as f:
    content = f.read()

target = """const uploadImageToCloudinary = async (fileDataUri: string): Promise<string> => {
  const res = await fetch("/api/upload", {"""

replacement = """const uploadImageToCloudinary = async (fileDataUri: string): Promise<string> => {
  const backendUrl = import.meta.env.VITE_API_URL || "";
  const res = await fetch(`${backendUrl}/api/upload`, {"""

content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)
