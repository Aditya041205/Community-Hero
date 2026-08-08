import os

file_path = "src/components/ReportForm.tsx"
with open(file_path, "r") as f:
    content = f.read()

target = """const uploadImageToCloudinary = async (fileDataUri: string): Promise<string> => {
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

replacement = """const uploadImageToCloudinary = async (fileDataUri: string): Promise<string> => {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: fileDataUri }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("Cloudinary upload failed:", data);
    throw new Error(data?.error || "Image upload failed");
  }

  return data.imageUrl;
};"""

content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)
