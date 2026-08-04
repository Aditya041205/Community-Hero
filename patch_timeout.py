import os

file_path = "src/components/ReportForm.tsx"
with open(file_path, "r") as f:
    content = f.read()

target = """      setTimeout(() => {
        onIssueReported({ id: docRef.id, title, category, status: "Pending AI" } as any);
      }, 2000);"""

replacement = """      setTimeout(() => {
        onIssueReported({ id: docRef.id, title, category, status: "Pending AI" } as any);
      }, 500);"""

content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)
