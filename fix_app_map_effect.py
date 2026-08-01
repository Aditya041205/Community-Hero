import os

file_path = "src/components/InteractiveMap.tsx"
with open(file_path, "r") as f:
    content = f.read()

target = """  useEffect(() => {
    if (clickedCoords && !isDashboard) {
      setCenter([clickedCoords.lat, clickedCoords.lng]);
    }
  }, [clickedCoords, isDashboard]); // Center when clickedCoords changes"""

replacement = """  useEffect(() => {
    if (clickedCoords && !isDashboard) {
      setCenter([clickedCoords.lat, clickedCoords.lng]);
    }
  }, [clickedCoords?.lat, clickedCoords?.lng, isDashboard]); // Center when clickedCoords changes"""

content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)
