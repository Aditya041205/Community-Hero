import os

file_path = "src/components/InteractiveMap.tsx"
with open(file_path, "r") as f:
    content = f.read()

target = """  const [center, setCenter] = useState<[number, number]>(clickedCoords ? [clickedCoords.lat, clickedCoords.lng] : [28.6139, 77.2090]); // Default New Delhi

  useEffect(() => {
    if (clickedCoords && !isDashboard) {
      setCenter([clickedCoords.lat, clickedCoords.lng]);
    }
  }, [isDashboard]); // Only on mount"""

replacement = """  const [center, setCenter] = useState<[number, number]>(clickedCoords ? [clickedCoords.lat, clickedCoords.lng] : [28.6139, 77.2090]); // Default New Delhi

  useEffect(() => {
    if (clickedCoords && !isDashboard) {
      setCenter([clickedCoords.lat, clickedCoords.lng]);
    }
  }, [clickedCoords, isDashboard]); // Center when clickedCoords changes
"""

content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)
