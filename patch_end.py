import os

file_path = "src/components/ReportForm.tsx"
with open(file_path, "r") as f:
    content = f.read()

idx1 = content.find("setTimeout(() => {")
idx2 = content.find("}, 500);", idx1)

if idx1 != -1 and idx2 != -1:
    replacement = """      console.log("Done");
      console.timeEnd("navigate()");
      console.timeEnd("Complaint Submit");
      onIssueReported({ id: docRef.id, title, category, status: "Pending AI", imageUrl } as any);
      setSubmitting(false);"""
    content = content[:idx1] + replacement + content[idx2+8:]
    with open(file_path, "w") as f:
        f.write(content)
