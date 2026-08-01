import re
with open("src/App.tsx", "r") as f:
    content = f.read()

pattern = r'<InteractiveMap[^>]*?clickedCoords=\{clickedCoords\}[^>]*?/>'
replacement = '''<ErrorBoundary fallback={<div className="w-full h-[500px] bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400 font-bold border border-white/10">Map could not be loaded.</div>}>
                            <InteractiveMap
                            issues={issues.filter(i => i?.status !== "Closed")}
                            selectedIssueId={selectedIssueId}
                            onSelectIssueId={(id: string) => setSelectedIssueId(id)}
                            onMapClick={handleMapClick}
                            clickedCoords={clickedCoords}
                          />
                          </ErrorBoundary>'''

content = re.sub(pattern, replacement, content, count=1, flags=re.DOTALL)

with open("src/App.tsx", "w") as f:
    f.write(content)
