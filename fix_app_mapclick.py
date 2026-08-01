import os

file_path = "src/App.tsx"
with open(file_path, "r") as f:
    content = f.read()

target = """  const handleMapClick = (lat: number, lng: number) => {
    setClickedCoords({ lat, lng });
  };"""
replacement = """  const handleMapClick = (lat: number, lng: number) => {
    setClickedCoords({ lat, lng });
    navigate("/report-issue");
  };"""

content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)
