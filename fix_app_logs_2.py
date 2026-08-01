import os

file_path = "src/App.tsx"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace("console.log(mappedIssues);", "const complaints = mappedIssues; console.log(complaints);")

with open(file_path, "w") as f:
    f.write(content)
