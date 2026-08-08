import os

file_path = "src/components/ReportForm.tsx"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace('          try { console.timeEnd("upload image"); } catch (e) {}', '          console.timeEnd("upload image");')
content = content.replace('          try { console.timeEnd("getDownloadURL"); } catch (e) {}', '          console.timeEnd("getDownloadURL");')
content = content.replace('          try { console.timeEnd("Complaint Submit"); } catch (e) {}', '          console.timeEnd("Complaint Submit");')

content = content.replace('      try { console.timeEnd("addDoc()"); } catch (e) {}', '      console.timeEnd("addDoc()");')
content = content.replace('      try { console.timeEnd("Complaint Submit"); } catch (e) {}', '      console.timeEnd("Complaint Submit");')

with open(file_path, "w") as f:
    f.write(content)
