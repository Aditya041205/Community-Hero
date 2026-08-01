import os

file_path = "src/components/ReportForm.tsx"
with open(file_path, "r") as f:
    content = f.read()

target = """    if (clickedCoords && lat === "" && lng === "") {
      setLat(clickedCoords.lat.toFixed(6));
      setLng(clickedCoords.lng.toFixed(6));
      reverseGeocode(clickedCoords.lat, clickedCoords.lng);
    }
  }, [clickedCoords]);"""
replacement = """    if (clickedCoords) {
      setLat(clickedCoords.lat.toFixed(6));
      setLng(clickedCoords.lng.toFixed(6));
      reverseGeocode(clickedCoords.lat, clickedCoords.lng);
    }
  }, [clickedCoords]);"""

content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)
