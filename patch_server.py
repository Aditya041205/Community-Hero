import os

file_path = "server.ts"
with open(file_path, "r") as f:
    content = f.read()

target = "// Mounting static assets or Vite middleware depending on active environment"

replacement = """// 10. API: Secure Cloudinary Image Upload
app.post("/api/upload", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "a1g8nbso";
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || "civic_action";

    const formData = new FormData();
    formData.append("file", image);
    formData.append("upload_preset", uploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Cloudinary upload failed in backend:", data);
      return res.status(500).json({ error: data?.error?.message || "Cloudinary upload failed" });
    }

    res.json({ imageUrl: data.secure_url });
  } catch (error: any) {
    console.error("Upload error in backend:", error);
    res.status(500).json({ error: error.message || "Failed to upload image" });
  }
});

// Mounting static assets or Vite middleware depending on active environment"""

content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)
