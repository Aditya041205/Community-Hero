import os

file_path = "src/App.tsx"
with open(file_path, "r") as f:
    content = f.read()

target = """                          {issues.filter(i => i?.status !== "Archived").length === 0 ? (
                            <div className="bg-slate-900/60 p-8 rounded-3xl border border-white/10 text-center text-slate-400 flex flex-col items-center justify-center h-[500px]">
                               <p className="font-bold text-lg">No complaints found.</p>
                            </div>
                          ) : ("""

replacement = """                          {issues.filter(i => i?.status !== "Archived").length === 0 ? (
                            <div className="bg-slate-900/60 p-8 rounded-3xl border border-white/10 text-center text-slate-400 flex flex-col items-center justify-center h-[500px]">
                               <div className="bg-slate-800/50 p-6 rounded-full mb-4 border border-white/5">
                                  <AlertCircle size={48} className="text-slate-500" />
                               </div>
                               <p className="font-bold text-lg text-slate-300">No complaints have been reported yet.</p>
                               <p className="text-sm text-slate-500 mt-2 mb-6 max-w-md">Be the first to report an issue in your community and help improve the neighborhood.</p>
                               <button 
                                 onClick={() => window.scrollTo(0, 0) || document.querySelector('[aria-label="Report Incident"]')?.dispatchEvent(new MouseEvent('click', {bubbles: true})) || (document.getElementById('nav-report') || document.querySelector('button:contains("Report Incident")'))?.click()}
                                 className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl font-bold text-white hover:brightness-110 transition shadow-lg flex items-center gap-2 cursor-pointer"
                               >
                                 <Plus size={18} />
                                 <span>Report Issue</span>
                               </button>
                            </div>
                          ) : ("""

content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)
