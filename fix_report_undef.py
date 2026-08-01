import os
import sys

file_path = "src/components/ReportForm.tsx"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace("imageUrl: imageUrl || image,", "imageUrl: imageUrl || image || null,")
content = content.replace("image: imageUrl || image,", "image: imageUrl || image || null,")
content = content.replace("address: address,", "address: address || \"\",")
content = content.replace("city: city,", "city: city || \"\",")
content = content.replace("state: stateName,", "state: stateName || \"\",")
content = content.replace("country: country,", "country: country || \"\",")
content = content.replace("duplicateOfId: issueData.duplicateOfId || null,", "duplicateOfId: issueData.duplicateOfId ?? null,")

with open(file_path, "w") as f:
    f.write(content)
