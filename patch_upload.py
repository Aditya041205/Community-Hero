import os

file_path = "src/components/ReportForm.tsx"
with open(file_path, "r") as f:
    content = f.read()

target = """    try {
      console.time("Complaint Submit");
      console.time("Firestore Save");
      console.log("Saving complaint...");
      
      // 1. Save complaint to Firestore immediately with status "Pending AI"
      const docRef = await addDoc(collection(db, "complaints"), {
        title: title || `Issue related to ${category}`,
        description: description || `Automatically reported ${category} via system.`,
        category: category || "Unknown",
        severity: "Medium",
        priority: "Normal",
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
      console.log("Complaint saved successfully");
      console.timeEnd("Firestore Save");

      // 2. Run independent tasks in parallel
      (async () => {
        try {
          const uploadPromise = async () => {
            if (!image) return null;
            console.time("Image Upload");
            console.log("Uploading image...");
            try {
              const imageId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
              const imageRef = ref(storage, `complaints/${imageId}`);
              await uploadString(imageRef, image, "data_url");
              console.log("Upload complete");
              const url = await getDownloadURL(imageRef);
              console.log("Download URL:", url);
              console.timeEnd("Image Upload");
              return url;
            } catch (err) {
              console.error("Image upload failed", err);
              console.timeEnd("Image Upload");
              return null;
            }
          };

          // B. Reverse Geocoding with 5s timeout"""

replacement = """    try {
      console.time("Complaint Submit");

      let uploadedUrl: string | null = null;
      if (image) {
        console.time("Image Upload");
        console.log("Uploading image...");
        try {
          const { uploadBytes } = await import("firebase/storage");
          const imageId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
          const imageRef = ref(storage, `complaints/${imageId}`);
          
          // Convert data URL to Blob for uploadBytes
          const response = await fetch(image);
          const blob = await response.blob();
          
          await uploadBytes(imageRef, blob);
          console.log("Upload complete");
          uploadedUrl = await getDownloadURL(imageRef);
          console.log("Download URL:", uploadedUrl);
          console.timeEnd("Image Upload");
        } catch (err: any) {
          console.error("Image upload failed", err);
          setErrorStatus(err.message || "Failed to upload image.");
          setSubmitting(false);
          console.timeEnd("Image Upload");
          console.timeEnd("Complaint Submit");
          return;
        }
      }

      console.time("Firestore Save");
      console.log("Saving complaint...");
      
      // 1. Save complaint to Firestore immediately with status "Pending AI"
      const docRef = await addDoc(collection(db, "complaints"), {
        title: title || `Issue related to ${category}`,
        description: description || `Automatically reported ${category} via system.`,
        category: category || "Unknown",
        severity: "Medium",
        priority: "Normal",
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
      console.log("Complaint saved successfully", docRef.id);
      console.timeEnd("Firestore Save");

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
            imageUrl: uploadedUrl,
            image: uploadedUrl,
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
            location: { lat: latitude, lng: longitude, address: geoData.address }
          });"""

content = content.replace(target2, replacement2)

with open(file_path, "w") as f:
    f.write(content)
