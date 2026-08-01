import os

file_path = "src/components/ReportForm.tsx"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace('const [lat, setLat] = useState("40.7128");', 'const [lat, setLat] = useState("");')
content = content.replace('const [lng, setLng] = useState("-74.0060");', 'const [lng, setLng] = useState("");')

target = """    if (isNaN(latitude) || isNaN(longitude)) {
      setErrorStatus("Please provide valid coordinates.");
      setSubmitting(false);
      return;
    }"""
replacement = """    if (isNaN(latitude) || isNaN(longitude) || lat === "" || lng === "") {
      setErrorStatus("Please select a location on the map.");
      setSubmitting(false);
      return;
    }"""
content = content.replace(target, replacement)

target2 = """               clickedCoords={{ lat: parseFloat(lat), lng: parseFloat(lng) }}"""
replacement2 = """               clickedCoords={lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng)) ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null}"""
content = content.replace(target2, replacement2)

with open(file_path, "w") as f:
    f.write(content)
