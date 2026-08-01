import os
import sys

file_path = "src/components/ReportForm.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Add imports
imports = """import { db, storage } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
"""
content = content.replace('import InteractiveMap from "./InteractiveMap";', 'import InteractiveMap from "./InteractiveMap";\n' + imports)

# Modify handleSubmit
target = """      const responseData = await res.json();
      
      onIssueReported(responseData.issue);"""

replacement = """      const responseData = await res.json();
      
      let imageUrl = "";
      if (image) {
        const imageRef = ref(storage, `complaints/${Date.now()}`);
        await uploadString(imageRef, image, "data_url");
        imageUrl = await getDownloadURL(imageRef);
      }

      const issueData = responseData.issue;
      
      // Save directly to Firestore!
      await addDoc(collection(db, "complaints"), {
        title: issueData.title,
        description: issueData.description,
        category: issueData.category,
        severity: issueData.urgency || "Medium",
        status: "Pending",
        createdAt: new Date().toISOString(),
        createdBy: currentUsername,
        reportedBy: user?.uid || "anonymous",
        reporterName: currentUsername,
        latitude: latitude,
        longitude: longitude,
        location: { lat: latitude, lng: longitude, address: address || "" },
        address: address,
        city: city,
        state: stateName,
        country: country,
        imageUrl: imageUrl || image, // fallback to base64 if upload fails
        image: imageUrl || image,
        upvotes: 0,
        verified: false,
        isMock: false,
        recommendation: issueData.recommendation || "",
        duplicateOfId: issueData.duplicateOfId || null,
        duplicateReason: issueData.duplicateReason || "",
      });

      // Show success, then wait, then redirect
      setReportResult({ 
        title: issueData.title, 
        urgency: issueData.urgency,
        duplicateOfId: issueData.duplicateOfId,
        duplicateReason: issueData.duplicateReason,
        recommendation: issueData.recommendation
      });
      
      setTitle("");
      setDescription("");
      setImage(null);
      
      setTimeout(() => {
        onIssueReported(issueData);
      }, 2000);
      return;"""

content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)
