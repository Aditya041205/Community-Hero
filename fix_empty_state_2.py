import os

file_path = "src/App.tsx"
with open(file_path, "r") as f:
    content = f.read()

target = """                               <button 
                                 onClick={() => window.scrollTo(0, 0) || document.querySelector('[aria-label="Report Incident"]')?.dispatchEvent(new MouseEvent('click', {bubbles: true})) || (document.getElementById('nav-report') || document.querySelector('button:contains("Report Incident")'))?.click()}
                                 className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl font-bold text-white hover:brightness-110 transition shadow-lg flex items-center gap-2 cursor-pointer"
                               >"""

replacement = """                               <button 
                                 onClick={() => navigate("/report-issue")}
                                 className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl font-bold text-white hover:brightness-110 transition shadow-lg flex items-center gap-2 cursor-pointer"
                               >"""

content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)
