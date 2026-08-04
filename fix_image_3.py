import os

file_path = "src/App.tsx"
with open(file_path, "r") as f:
    content = f.read()

target = """                                    <p className="text-xs text-slate-300 leading-relaxed">{selectedIssue.description}</p>
                                    
                                    {selectedIssue.resolutionNotes && ("""

replacement = """                                    <p className="text-xs text-slate-300 leading-relaxed">{selectedIssue.description}</p>
                                    
                                    {selectedIssue.image ? (
                                       <img src={selectedIssue.image} alt="Complaint" className="w-full h-48 object-cover rounded-lg mt-1" loading="lazy" referrerPolicy="no-referrer" />
                                     ) : (
                                       <div className="w-full h-48 flex items-center justify-center rounded-lg border border-white/10 mt-1 bg-slate-900/50 text-slate-500 font-medium text-xs">
                                         No Evidence Photo
                                       </div>
                                     )}
                                    
                                    {selectedIssue.resolutionNotes && ("""

content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)
