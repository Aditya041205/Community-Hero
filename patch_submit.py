import os
import re

file_path = "src/components/ReportForm.tsx"
with open(file_path, "r") as f:
    content = f.read()

target = """    try {
      // 1. Save complaint to Firestore immediately with status "Pending AI"
      const docRef = await addDoc(collection(db, "complaints"), {
        title: title || `Issue related to ${category}`,
        description: description || `Automatically reported ${category} via system.`,
        category: category || "Unknown",
        severity: "Medium",
        status: "Pending AI",
        createdAt: new Date().toISOString(),
        createdBy: currentUsername,
        reportedBy: user?.uid || "anonymous",
        reporterName: currentUsername,
        latitude: latitude,
        longitude: longitude,
        location: { lat: latitude, lng: longitude, address: "" },
        address: "",
        city: "",
        state: "",
        country: "",
        imageUrl: null,
        image: null,
        upvotes: 0,
        verified: false,
        isMock: false,
        recommendation: "",
        duplicateOfId: null,
        duplicateReason: "",
      });

      // 2. Run independent tasks in parallel
      (async () => {
        try {
          // A. Image Upload
          const uploadPromise = async () => {
            if (!image) return null;
            try {
              const imageRef = ref(storage, `complaints/${docRef.id}_${Date.now()}`);
              await uploadString(imageRef, image, "data_url");
              return await getDownloadURL(imageRef);
            } catch (err) {
              console.error("Image upload failed", err);
              return null;
            }
          };

          // B. Reverse Geocoding with 5s timeout"""

replacement = """    try {
      let uploadedUrl: string | null = null;
      
      if (image) {
        console.log("Uploading image...");
        try {
          const imageId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
          const imageRef = ref(storage, `complaints/${imageId}`);
          await uploadString(imageRef, image, "data_url");
          console.log("Upload complete");
          uploadedUrl = await getDownloadURL(imageRef);
          console.log("Download URL:", uploadedUrl);
        } catch (err) {
          console.error("Image upload failed", err);
        }
      }

      console.log("Saving complaint...");
      // 1. Save complaint to Firestore immediately with status "Pending AI"
      const docRef = await addDoc(collection(db, "complaints"), {
        title: title || `Issue related to ${category}`,
        description: description || `Automatically reported ${category} via system.`,
        category: category || "Unknown",
        severity: "Medium",
        status: "Pending AI",
        createdAt: new Date().toISOString(),
        createdBy: currentUsername,
        reportedBy: user?.uid || "anonymous",
        reporterName: currentUsername,
        latitude: latitude,
        longitude: longitude,
        location: { lat: latitude, lng: longitude, address: "" },
        address: "",
        city: "",
        state: "",
        country: "",
        imageUrl: uploadedUrl,
        image: uploadedUrl,
        upvotes: 0,
        verified: false,
        isMock: false,
        recommendation: "",
        duplicateOfId: null,
        duplicateReason: "",
      });
      console.log("Complaint saved successfully");

      // 2. Run independent tasks in parallel
      (async () => {
        try {
          // B. Reverse Geocoding with 5s timeout"""

content = content.replace(target, replacement)

target2 = """          const [uploadedUrl, geoData, aiData] = await Promise.all([
            uploadPromise(),
            geocodePromise(),
            aiPromise()
          ]);

          // Update Firestore
          await updateDoc(docRef, {
            title: aiData.title || title || `Issue related to ${category}`,
            description: aiData.description || description || `Automatically reported ${category} via system.`,
            category: aiData.category || "Unknown",
            severity: aiData.urgency || "Medium",
            recommendation: aiData.recommendation || "",
            duplicateOfId: aiData.duplicateOfId || null,
            duplicateReason: aiData.duplicateReason || "",
            status: "Pending",
            address: geoData.address,
            city: geoData.city,
            state: geoData.state,
            country: geoData.country,
            location: { lat: latitude, lng: longitude, address: geoData.address },
            imageUrl: uploadedUrl || null,
            image: uploadedUrl || null,
          });"""

replacement2 = """          const [geoData, aiData] = await Promise.all([
            geocodePromise(),
            aiPromise()
          ]);

          // Update Firestore
          await updateDoc(docRef, {
            title: aiData.title || title || `Issue related to ${category}`,
            description: aiData.description || description || `Automatically reported ${category} via system.`,
            category: aiData.category || "Unknown",
            severity: aiData.urgency || "Medium",
            recommendation: aiData.recommendation || "",
            duplicateOfId: aiData.duplicateOfId || null,
            duplicateReason: aiData.duplicateReason || "",
            status: "Pending",
            address: geoData.address,
            city: geoData.city,
            state: geoData.state,
            country: geoData.country,
            location: { lat: latitude, lng: longitude, address: geoData.address },
            imageUrl: uploadedUrl,
            image: uploadedUrl,
          });"""

content = content.replace(target2, replacement2)

with open(file_path, "w") as f:
    f.write(content)

