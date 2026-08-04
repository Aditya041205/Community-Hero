import os

files_to_patch = [
    ("src/components/AuthorityPanel.tsx", "selectedIssue.image", "selectedIssue.imageUrl"),
    ("src/components/ResolvedComplaintsPage.tsx", "issue.image", "issue.imageUrl"),
    ("src/components/ResolvedComplaintsPage.tsx", "image: data.imageUrl || \"\",", "imageUrl: data.imageUrl || \"\","),
]

for file_path, target, replacement in files_to_patch:
    with open(file_path, "r") as f:
        content = f.read()
    content = content.replace(target, replacement)
    with open(file_path, "w") as f:
        f.write(content)
