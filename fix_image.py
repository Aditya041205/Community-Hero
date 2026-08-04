import os

file_path = "src/App.tsx"
with open(file_path, "r") as f:
    content = f.read()

target1 = """        const data = docSnap.data();
        return {"""

replacement1 = """        const data = docSnap.data();
        const complaintImage = data.imageUrl || data.imageURL || data.photoUrl || data.photo || data.image || data.evidenceImageUrl || data.evidenceImage || data.fileUrl || "";
        console.log("Complaint:", data);
        console.log("Image URL:", complaintImage);
        
        return {"""

content = content.replace(target1, replacement1)

target2 = """          recommendation: data.recommendation || undefined,
          image: data.imageUrl || "",
          isMock: false,"""

replacement2 = """          recommendation: data.recommendation || undefined,
          image: complaintImage,
          isMock: false,"""

content = content.replace(target2, replacement2)

target3 = """                                     {issue.image && (
                                       <img src={issue.image} alt={issue.title} className="w-full h-24 object-cover rounded-lg border border-white/10 mt-1" referrerPolicy="no-referrer" />
                                     )}"""

replacement3 = """                                     {issue.image ? (
                                       <img src={issue.image} alt={issue.title} className="w-full h-48 object-cover rounded-lg border border-white/10 mt-1" referrerPolicy="no-referrer" loading="lazy" />
                                     ) : (
                                       <div className="w-full h-48 flex items-center justify-center rounded-lg border border-white/10 mt-1 bg-slate-900/50 text-slate-500 font-medium text-xs">
                                         No Evidence Photo
                                       </div>
                                     )}"""

content = content.replace(target3, replacement3)

with open(file_path, "w") as f:
    f.write(content)
