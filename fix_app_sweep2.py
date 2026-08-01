import os

file_path = "src/App.tsx"
with open(file_path, "r") as f:
    content = f.read()

target = """               if (data.isMock !== false || !data.title || data.title.includes("Encountered") || data.title.includes("General Roadway") || data.title.includes("Unspecified") || data.title.includes("Fallen Tree") || data.title.includes("Demo") || data.isMock === true) {"""

replacement = """               if (data.isMock === true || !data.title || data.title.includes("Encountered") || data.title.includes("General Roadway") || data.title.includes("Unspecified") || data.title.includes("Fallen Tree") || data.title.includes("Demo")) {"""

content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)
