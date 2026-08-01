import os

file_path = "src/App.tsx"
with open(file_path, "r") as f:
    content = f.read()

target = """  const handleMapClick = (lat: number, lng: number) => {
    // Only set coords if we are NOT on the report page (ReportForm has its own local state that we seed with clickedCoords)
    // Actually, report form can use clickedCoords but it handles its own onMapClick locally and overrides the map component prop `onMapClick={handleLocationUpdate}`
    // If the map is on the dashboard, we set clicked coords so that if they click "Report", it seeds it.
    setClickedCoords({ lat, lng });
  };"""
replacement = """  const handleMapClick = (lat: number, lng: number) => {
    setClickedCoords({ lat, lng });
  };"""

content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)
