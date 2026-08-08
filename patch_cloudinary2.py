import os

file_path = "src/components/ReportForm.tsx"
with open(file_path, "r") as f:
    content = f.read()

target1 = """const uploadImageToCloudinary = async (fileDataUri: string): Promise<string> => {
  const cloudName = "dkd5jyxby"; // Replace with your cloudName
  const uploadPreset = "ml_default"; // Replace with your uploadPreset
  const formData = new FormData();
  formData.append("file", fileDataUri);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Failed to upload image to Cloudinary");
  }

  const data = await res.json();
  return data.secure_url;
};"""

replacement1 = """const uploadImageToCloudinary = async (fileDataUri: string): Promise<string> => {
  const cloudName = "a1g8nbso";
  const uploadPreset = "civic_action";
  const formData = new FormData();
  formData.append("file", fileDataUri);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("Cloudinary upload failed:", data);
    throw new Error(data?.error?.message || "Cloudinary upload failed");
  }

  return data.secure_url;
};"""

content = content.replace(target1, replacement1)

target2 = """      let uploadedUrl: string = "";"""
replacement2 = """      let uploadedUrl: string | null = null;"""
content = content.replace(target2, replacement2)

with open(file_path, "w") as f:
    f.write(content)
