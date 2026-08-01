import os

file_path = "src/App.tsx"
with open(file_path, "r") as f:
    content = f.read()

target = """      console.log(`[COMPLAINT-SYNC] Received ${mappedIssues.length} issues from Firestore.`);
      console.log("[DEBUG] Firestore loaded. Complaints loaded.");
      setIssues(mappedIssues);"""

replacement = """      console.log(`[COMPLAINT-SYNC] Received ${mappedIssues.length} issues from Firestore.`);
      console.log("[DEBUG] Firestore loaded. Complaints loaded:");
      console.log(mappedIssues);
      console.log("[DEBUG] Firestore collection path: complaints");
      mappedIssues.forEach(issue => {
        console.log(`[DEBUG] Document ID: ${issue.id} | Coordinates: ${issue.latitude}, ${issue.longitude}`);
      });
      setIssues(mappedIssues);"""

content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)
