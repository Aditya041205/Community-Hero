import os

file_path = "src/components/ReportForm.tsx"
with open(file_path, "r") as f:
    content = f.read()

start_idx = content.find("const handleSubmit = async (e: React.FormEvent) => {")
end_idx = content.find("return (\n    <div className=\"bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl h-full relative overflow-hidden\">", start_idx)

original = content[start_idx:end_idx]

replacement = """const handleSubmit = async (e: React.FormEvent) => {
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
            imageUrl: uploadedUrl || null,
            image: uploadedUrl || null,
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
      }, 2000);

    } catch (error: any) {
      setErrorStatus(error.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  """

content = content.replace(original, replacement)

with open(file_path, "w") as f:
    f.write(content)
