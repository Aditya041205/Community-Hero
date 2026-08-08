import os

file_path = "src/components/ReportForm.tsx"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace('console.log("STEP 1 START: image upload");', 'console.log("Uploading Image...");')
content = content.replace('console.log("STEP 1 END: image upload");', 'console.log("Image Uploaded");')
content = content.replace('console.log("STEP 2 END: getDownloadURL - ", uploadedUrl);', 'console.log("Download URL:", uploadedUrl);')
content = content.replace('console.log("STEP 2 START: getDownloadURL");', '')
content = content.replace('console.log("STEP 3 START: addDoc");', 'console.log("Saving Firestore...");')
content = content.replace('console.log("STEP 3 END: addDoc - ID:", docRef.id);', 'console.log("Firestore Saved");')
content = content.replace('console.log("STEP 7 START: navigation");', 'console.log("Navigating...");')
content = content.replace('console.log("STEP 7 END: navigation");', '')

# Replace console.log(firestoreData); with console.log(firestoreData); -> Actually, user said `console.log(data);`? No, my var is firestoreData, so `console.log(firestoreData)` is good enough. Wait, user says `console.log(data);` but I don't have `data`, I have `firestoreData`.

with open(file_path, "w") as f:
    f.write(content)
