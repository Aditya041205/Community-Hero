import os

file_path = "src/components/ReportForm.tsx"
with open(file_path, "r") as f:
    content = f.read()

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

    const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number, name: string): Promise<T> => {
      let timeoutHandle: any;
      const timeoutPromise = new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error(`${name} timeout`)), timeoutMs);
      });
      return Promise.race([
        promise.finally(() => clearTimeout(timeoutHandle)),
        timeoutPromise
      ]);
    };

    try {
      console.time("Complaint Submit");

      let uploadedUrl: string | null = null;
      if (image) {
        console.time("upload image");
        console.log("STEP 1 START: image upload");
        try {
          const imageId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
          const imageRef = ref(storage, `complaints/${imageId}`);
          const response = await fetch(image);
          const blob = await response.blob();
          
          await withTimeout(uploadBytes(imageRef, blob), 10000, "uploadBytes");
          console.log("STEP 1 END: image upload");
          console.timeEnd("upload image");
          
          console.time("getDownloadURL");
          console.log("STEP 2 START: getDownloadURL");
          uploadedUrl = await withTimeout(getDownloadURL(imageRef), 10000, "getDownloadURL");
          console.log("STEP 2 END: getDownloadURL - ", uploadedUrl);
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
      }

      console.time("addDoc()");
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
      
      console.log("STEP 3 START: addDoc");
      let docRef: any;
      try {
        docRef = await withTimeout(addDoc(collection(db, "complaints"), firestoreData), 10000, "addDoc");
        console.log("STEP 3 END: addDoc - ID:", docRef.id);
        console.timeEnd("addDoc()");
      } catch (err: any) {
        console.error("addDoc error", err);
        setErrorStatus(err.message || "Failed to save complaint to database.");
        setSubmitting(false);
        return;
      }

      // Background tasks
      (async () => {
        try {
          const geocodePromise = async () => {
            console.time("reverse geocoding");
            console.log("STEP 4 START: reverse geocoding");
            try {
              const fetchPromise = fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
              const res = await withTimeout(fetchPromise, 5000, "reverse geocoder");
              if (res.ok) {
                const data = await res.json();
                console.log("STEP 4 END: reverse geocoding");
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
            console.log("STEP 4 END: reverse geocoding (failed)");
            console.timeEnd("reverse geocoding");
            return { address: "", city: "", state: "", country: "" };
          };

          const aiPromise = async () => {
            console.time("AI analysis");
            console.log("STEP 5 START: AI analysis");
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
              const fetchPromise = fetch("/api/issues/report", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify(payload)
              });
              const res = await withTimeout(fetchPromise, 10000, "AI API");
              if (res.ok) {
                const responseData = await res.json();
                console.log("STEP 5 END: AI analysis");
                console.timeEnd("AI analysis");
                return responseData.issue;
              }
            } catch (err) {
              console.error("AI Analysis error", err);
            }
            console.log("STEP 5 END: AI analysis (failed)");
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

          console.time("updateDoc()");
          console.log("STEP 6 START: updateDoc");
          try {
            await withTimeout(updateDoc(docRef, {
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
            }), 10000, "updateDoc");
            console.log("STEP 6 END: updateDoc");
          } catch (err) {
            console.error("updateDoc error", err);
          }
          console.timeEnd("updateDoc()");
        } catch (err) {
          console.error("Background tasks failed", err);
        }
      })();

      console.time("navigate()");
      console.log("STEP 7 START: navigation");
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
        console.log("STEP 7 END: navigation");
        console.log("Done");
        console.timeEnd("navigate()");
        console.timeEnd("Complaint Submit");
        onIssueReported({ id: docRef.id, title, category, status: "Pending AI" } as any);
        setSubmitting(false); // Reset submit state just in case
      }, 500);
    } catch (error: any) {
      console.error("Submission error:", error);
      setErrorStatus(error.message || "Failed to submit report");
      setSubmitting(false);
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
