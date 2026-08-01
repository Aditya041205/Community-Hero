import os
import sys

file_path = "src/components/InteractiveMap.tsx"
with open(file_path, "r") as f:
    content = f.read()

target = """        (error) => {
          console.error("Error getting location:", error);
        }"""

replacement = """        (error) => {
          console.error("Error getting location:", error);
          alert("Location permission denied. Please select the location manually.");
        }"""

content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)
