import os

file_path = "src/App.tsx"
with open(file_path, "r") as f:
    content = f.read()

target = """  const handleMapClick = (lat: number, lng: number) => {
    setClickedCoords({ lat, lng });
    // Removed automatic redirect to /report-issue as per user instructions
  };"""

replacement = """  const handleMapClick = (lat: number, lng: number) => {
    setClickedCoords({ lat, lng });
    // Keep user on the same view and just set the clicked coords
  };"""

content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)
