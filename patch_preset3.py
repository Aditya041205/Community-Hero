import os

file_path = "src/components/ReportForm.tsx"
with open(file_path, "r") as f:
    content = f.read()

target1 = """const uploadImageToCloudinary = async (fileDataUri: string, fallback = false): Promise<string> => {
  const cloudName = "a1g8nbso";
  const uploadPreset = fallback ? "ml_default" : "civic_action";
  const formData = new FormData();
  formData.append("file", fileDataUri);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    if (!fallback && data?.error?.message?.includes("preset not found")) {
      console.warn("Preset civic_action not found, trying ml_default...");
      return uploadImageToCloudinary(fileDataUri, true);
    }
    console.error("Cloudinary upload failed:", data);
    throw new Error(data?.error?.message || "Cloudinary upload failed");
  }

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
    let errorMessage = data?.error?.message || "Cloudinary upload failed";
    if (errorMessage.includes("preset not found")) {
      errorMessage = `Cloudinary Error: Upload preset '${uploadPreset}' not found. Please ensure you have created an unsigned upload preset named '${uploadPreset}' in your Cloudinary dashboard (Settings -> Upload -> Upload presets).`;
    }
    throw new Error(errorMessage);
  }

  return data.secure_url;
};"""

content = content.replace(target1, replacement1)

with open(file_path, "w") as f:
    f.write(content)
