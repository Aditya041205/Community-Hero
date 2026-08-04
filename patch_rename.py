import os

files_to_patch = [
    ("src/types.ts", "image?: string; // base64", "imageUrl?: string;"),
    ("src/App.tsx", "{issue.image ?", "{issue.imageUrl ?"),
    ("src/App.tsx", "src={issue.image}", "src={issue.imageUrl}"),
    ("src/App.tsx", "{selectedIssue.image ?", "{selectedIssue.imageUrl ?"),
    ("src/App.tsx", "src={selectedIssue.image}", "src={selectedIssue.imageUrl}"),
    ("src/App.tsx", "image: complaintImage", "imageUrl: complaintImage"),
]

for file_path, target, replacement in files_to_patch:
    with open(file_path, "r") as f:
        content = f.read()
    content = content.replace(target, replacement)
    with open(file_path, "w") as f:
        f.write(content)
