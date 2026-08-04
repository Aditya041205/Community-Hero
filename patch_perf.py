import os
import re

file_path = "src/components/ReportForm.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Locate the beginning of handleSubmit
target = """  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorStatus(null);
    setReportResult(null);

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    if (isNaN(latitude) || isNaN(longitude) || lat === "" || lng === "") {
      setErrorStatus("Please select a location on the map.");
      setSubmitting(false);
      return;
    }

    try {
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
          // B. Reverse Geocoding with 5s timeout
          const geocodePromise = async () => {
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 5000);
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, { signal: controller.signal });
              clearTimeout(timeoutId);
              if (res.ok) {
                const data = await res.json();
                return {
                  address: data.display_name || "",
                  city: data.address?.city || data.address?.town || data.address?.village || "",
                  state: data.address?.state || "",
                  country: data.address?.country || ""
                };
              }
            } catch (err) {
              console.warn("Reverse geocoding timeout or failed", err);
            }
            return { address: "", city: "", state: "", country: "" };
          };

          // C. AI Analysis with 15s timeout
          const aiPromise = async () => {
            const payload = {
              title: title || `Issue related to ${category}`,
              description: description || `Automatically reported ${category} via system.`,
              category,
              latitude,
              longitude,
              image,
              reporterName: currentUsername
            };
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 15000);
              const res = await fetch("/api/issues/report", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify(payload),
                signal: controller.signal
              });
              clearTimeout(timeoutId);
              if (res.ok) {
                const responseData = await res.json();
                return responseData.issue;
              }
            } catch (err) {
              console.warn("AI Analysis timeout or failed", err);
            }
            return {
              title: title || `Issue related to ${category}`,
              description: description || `Automatically reported ${category} via system.`,
              category: "Unknown",
              urgency: "Medium",
              recommendation: "",
              duplicateOfId: null,
              duplicateReason: ""
            };
          };

          const [geoData, aiData] = await Promise.all([
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
          });
        } catch (err) {
          console.error("Background tasks failed", err);
        }
      })();"""

replacement = """  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorStatus(null);
    setReportResult(null);

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    if (isNaN(latitude) || isNaN(longitude) || lat === "" || lng === "") {
      setErrorStatus("Please select a location on the map.");
      setSubmitting(false);
      return;
    }

    try {
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

          // B. Reverse Geocoding with 5s timeout
          const geocodePromise = async () => {
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 5000);
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, { signal: controller.signal });
              clearTimeout(timeoutId);
              if (res.ok) {
                const data = await res.json();
                return {
                  address: data.display_name || "",
                  city: data.address?.city || data.address?.town || data.address?.village || "",
                  state: data.address?.state || "",
                  country: data.address?.country || ""
                };
              }
            } catch (err) {
              console.warn("Reverse geocoding timeout or failed", err);
            }
            return { address: "", city: "", state: "", country: "" };
          };

          // C. AI Analysis with 15s timeout
          const aiPromise = async () => {
            console.time("AI Analysis");
            const payload = {
              title: title || `Issue related to ${category}`,
              description: description || `Automatically reported ${category} via system.`,
              category,
              latitude,
              longitude,
              image,
              reporterName: currentUsername
            };
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 15000);
              const res = await fetch("/api/issues/report", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify(payload),
                signal: controller.signal
              });
              clearTimeout(timeoutId);
              if (res.ok) {
                const responseData = await res.json();
                console.timeEnd("AI Analysis");
                return responseData.issue;
              }
            } catch (err) {
              console.warn("AI Analysis timeout or failed", err);
            }
            console.timeEnd("AI Analysis");
            return {
              title: title || `Issue related to ${category}`,
              description: description || `Automatically reported ${category} via system.`,
              category: "Unknown",
              urgency: "Medium",
              recommendation: "",
              duplicateOfId: null,
              duplicateReason: ""
            };
          };

          const [uploadedUrl, geoData, aiData] = await Promise.all([
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
          });
        } catch (err) {
          console.error("Background tasks failed", err);
        }
      })();"""

content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)
