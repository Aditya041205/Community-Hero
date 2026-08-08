import os

file_path = "src/components/ReportForm.tsx"
with open(file_path, "r") as f:
    content = f.read()

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
      console.time("Complaint Submit");

      let uploadedUrl: string | null = null;
      if (image) {
        console.time("Image Upload");
        console.log("Upload started...");
        try {
          const imageId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
          const imageRef = ref(storage, `complaints/${imageId}`);
          
          // Convert data URL to Blob for uploadBytes
          const response = await fetch(image);
          const blob = await response.blob();
          
          await uploadBytes(imageRef, blob);
          console.log("Upload completed.");
          uploadedUrl = await getDownloadURL(imageRef);
          console.log("Download URL:", uploadedUrl);
          if (!uploadedUrl) {
            throw new Error("Download URL returned from Firebase is null");
          }
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
      console.log("Firestore imageUrl:", uploadedUrl);
      
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
            location: { lat: latitude, lng: longitude, address: geoData.address }
          });
        } catch (err) {
          console.error("Background tasks failed", err);
        }
      })();

      // Show success, then wait, then redirect
      setReportResult({ 
        title: title || "Issue Reported", 
        urgency: "Medium",
        duplicateOfId: null,
        duplicateReason: "",
        recommendation: ""
      });
      
      setTitle("");
      setDescription("");
      setImage(null);
      
      setTimeout(() => {
        onIssueReported({ id: docRef.id, title, category, status: "Pending AI" } as any);
      }, 500);
    } catch (error: any) {
      setErrorStatus(error.message || "Failed to submit report");
      setSubmitting(false);
    }
    // We do NOT call setSubmitting(false) on success because we want the spinner/disabled state to remain while redirecting.
  };"""

replacement = """  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form Submitted");
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

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 10000);

    try {
      console.time("Complaint Submit");

      let uploadedUrl: string | null = null;
      if (image) {
        console.time("Image Upload");
        console.log("Uploading Image...");
        try {
          const imageId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
          const imageRef = ref(storage, `complaints/${imageId}`);
          
          const response = await fetch(image);
          const blob = await response.blob();
          
          await uploadBytes(imageRef, blob);
          console.log("Image Uploaded");
          console.timeEnd("Image Upload");
          
          console.time("getDownloadURL");
          uploadedUrl = await getDownloadURL(imageRef);
          console.log("Download URL:", uploadedUrl);
          console.timeEnd("getDownloadURL");
          if (!uploadedUrl) {
            throw new Error("Download URL returned from Firebase is null");
          }
        } catch (err: any) {
          console.error("Image upload failed", err);
          setErrorStatus(err.message || "Failed to upload image.");
          setSubmitting(false);
          try { console.timeEnd("Image Upload"); } catch (e) {}
          try { console.timeEnd("getDownloadURL"); } catch (e) {}
          try { console.timeEnd("Complaint Submit"); } catch (e) {}
          return;
        }
      } else {
        uploadedUrl = "";
      }

      console.time("addDoc");
      console.log("Preparing Firestore Data");
      
      const firestoreData = {
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
      };
      console.log(firestoreData);
      
      console.log("Saving Firestore...");
      const docRef = await Promise.race([
        addDoc(collection(db, "complaints"), firestoreData),
        new Promise<any>((_, reject) => {
          if (abortController.signal.aborted) {
            reject(new Error("Complaint submission timeout"));
          }
          abortController.signal.addEventListener("abort", () => {
            reject(new Error("Complaint submission timeout"));
          });
        })
      ]);
      console.log("Firestore Saved");
      console.timeEnd("addDoc");

      // Background tasks
      (async () => {
        try {
          const geocodePromise = async () => {
            console.time("reverse geocoding");
            try {
              const controller = new AbortController();
              const geoTimeoutId = setTimeout(() => controller.abort(), 5000);
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, { signal: controller.signal });
              clearTimeout(geoTimeoutId);
              if (res.ok) {
                const data = await res.json();
                console.timeEnd("reverse geocoding");
                return {
                  address: data.display_name || "",
                  city: data.address?.city || data.address?.town || data.address?.village || "",
                  state: data.address?.state || "",
                  country: data.address?.country || ""
                };
              }
            } catch (err) {
              console.error("Reverse geocoding error", err);
            }
            console.timeEnd("reverse geocoding");
            return { address: "", city: "", state: "", country: "" };
          };

          const aiPromise = async () => {
            console.time("AI analysis");
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
              const aiTimeoutId = setTimeout(() => controller.abort(), 10000);
              const res = await fetch("/api/issues/report", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify(payload),
                signal: controller.signal
              });
              clearTimeout(aiTimeoutId);
              if (res.ok) {
                const responseData = await res.json();
                console.timeEnd("AI analysis");
                return responseData.issue;
              }
            } catch (err) {
              console.error("AI Analysis error", err);
            }
            console.timeEnd("AI analysis");
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

          console.time("updateDoc");
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
          });
          console.timeEnd("updateDoc");
        } catch (err) {
          console.error("Background tasks failed", err);
        }
      })();

      console.time("navigate");
      console.log("Navigating...");
      setReportResult({ 
        title: title || "Issue Reported", 
        urgency: "Medium",
        duplicateOfId: null,
        duplicateReason: "",
        recommendation: ""
      });
      
      setTitle("");
      setDescription("");
      setImage(null);
      
      setTimeout(() => {
        console.log("Done");
        console.timeEnd("navigate");
        console.timeEnd("Complaint Submit");
        onIssueReported({ id: docRef.id, title, category, status: "Pending AI" } as any);
        setSubmitting(false); // Reset submit state just in case
      }, 500);
    } catch (error: any) {
      console.error("Submission error:", error);
      setErrorStatus(error.message || "Failed to submit report");
      setSubmitting(false);
      try { console.timeEnd("addDoc"); } catch (e) {}
      try { console.timeEnd("Complaint Submit"); } catch (e) {}
    } finally {
      clearTimeout(timeoutId);
    }
  };"""

idx = content.find("  const handleSubmit = async (e: React.FormEvent) => {")
idx_end = content.find("  return (", idx)

if idx != -1 and idx_end != -1:
    content = content[:idx] + replacement + "\n" + content[idx_end:]
    with open(file_path, "w") as f:
        f.write(content)
else:
    print("Could not find handleSubmit")
