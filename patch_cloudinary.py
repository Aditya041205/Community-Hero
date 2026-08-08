import os

file_path = "src/components/ReportForm.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Remove firebase/storage imports
content = content.replace('import { ref, uploadString, getDownloadURL, uploadBytes } from "firebase/storage";\n', '')
content = content.replace('import { db, storage } from "../lib/firebase";', 'import { db } from "../lib/firebase";')
content = content.replace('import { collection, addDoc, updateDoc } from "firebase/firestore";', 'import { collection, addDoc, updateDoc, serverTimestamp } from "firebase/firestore";')

upload_fn = """
const uploadImageToCloudinary = async (fileDataUri: string): Promise<string> => {
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
};
"""

content = content.replace("export interface ReportFormProps {", upload_fn + "\nexport interface ReportFormProps {")
content = content.replace("interface ReportFormProps {", upload_fn + "\ninterface ReportFormProps {")

target_upload_block = """      let uploadedUrl: string | null = null;
      if (image) {
        console.time("upload image");
        console.log("Uploading Image...");
        try {
          const imageId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
          const imageRef = ref(storage, `complaints/${imageId}`);
          const response = await fetch(image);
          const blob = await response.blob();
          
          await withTimeout(uploadBytes(imageRef, blob), 10000, "uploadBytes");
          console.log("Image Uploaded");
          console.timeEnd("upload image");
          
          console.time("getDownloadURL");
          
          uploadedUrl = await withTimeout(getDownloadURL(imageRef), 10000, "getDownloadURL");
          console.log("Download URL:", uploadedUrl);
          console.timeEnd("getDownloadURL");
          if (!uploadedUrl) {
            throw new Error("Download URL returned from Firebase is null");
          }
        } catch (err: any) {
          console.error("Image upload failed", err);
          setErrorStatus(err.message || "Failed to upload image.");
          setSubmitting(false);
          return;
        }
      } else {
        uploadedUrl = "";
      }"""

replacement_upload_block = """      let uploadedUrl: string = "";
      if (image) {
        console.time("upload image");
        console.log("Uploading Image...");
        try {
          uploadedUrl = await withTimeout(uploadImageToCloudinary(image), 15000, "upload image to Cloudinary");
          console.log("Image Uploaded");
          console.log("Download URL:", uploadedUrl);
          console.timeEnd("upload image");
          if (!uploadedUrl) {
            throw new Error("Download URL returned from Cloudinary is null");
          }
        } catch (err: any) {
          console.error("Image upload failed", err);
          setErrorStatus(err.message || "Failed to upload image.");
          setSubmitting(false);
          try { console.timeEnd("upload image"); } catch (e) {}
          return;
        }
      }"""

content = content.replace(target_upload_block, replacement_upload_block)

target_firestore_data = """        status: "Pending AI",
        createdAt: new Date().toISOString(),
        createdBy: currentUsername,"""

replacement_firestore_data = """        status: "Pending AI",
        createdAt: serverTimestamp(),
        createdBy: currentUsername,"""

content = content.replace(target_firestore_data, replacement_firestore_data)

target_timeout = """      setTimeout(() => {
        console.log("Done");
        console.timeEnd("navigate()");
        console.timeEnd("Complaint Submit");
        onIssueReported({ id: docRef.id, title, category, status: "Pending AI" } as any);
        setSubmitting(false); // Reset submit state just in case
      }, 500);"""

replacement_timeout = """      console.log("Done");
      console.timeEnd("navigate()");
      console.timeEnd("Complaint Submit");
      onIssueReported({ id: docRef.id, title, category, status: "Pending AI", imageUrl: uploadedUrl, image: uploadedUrl } as any);
      setSubmitting(false);"""

content = content.replace(target_timeout, replacement_timeout)

with open(file_path, "w") as f:
    f.write(content)
