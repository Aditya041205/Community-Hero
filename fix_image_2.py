import os

file_path = "src/App.tsx"
with open(file_path, "r") as f:
    content = f.read()

target = """                                     {issue.image ? (
                                       <img src={issue.image} alt={issue.title} className="w-full h-48 object-cover rounded-lg border border-white/10 mt-1" referrerPolicy="no-referrer" loading="lazy" />
                                     ) : (
                                       <div className="w-full h-48 flex items-center justify-center rounded-lg border border-white/10 mt-1 bg-slate-900/50 text-slate-500 font-medium text-xs">
                                         No Evidence Photo
                                       </div>
                                     )}"""

replacement = """                                     {issue.image ? (
                                       <img src={issue.image} alt="Complaint" className="w-full h-48 object-cover rounded-lg mt-1" loading="lazy" referrerPolicy="no-referrer" />
                                     ) : (
                                       <div className="w-full h-48 flex items-center justify-center rounded-lg border border-white/10 mt-1 bg-slate-900/50 text-slate-500 font-medium text-xs">
                                         No Evidence Photo
                                       </div>
                                     )}"""

content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)
