with open("src/App.tsx", "r") as f:
    content = f.read()

target = """                            <InteractiveMap
                            issues={issues.filter(i => i?.status !== "Closed")}
                            selectedIssueId={selectedIssueId}
                            onSelectIssueId={(id: string) => setSelectedIssueId(id)}
                            onMapClick={handleMapClick}
                            clickedCoords={clickedCoords}
                          />"""

replacement = """                            <ErrorBoundary fallback={<div className="w-full h-[500px] bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400 font-bold border border-white/10">Map could not be loaded.</div>}>
                            <InteractiveMap
                            issues={issues.filter(i => i?.status !== "Closed")}
                            selectedIssueId={selectedIssueId}
                            onSelectIssueId={(id: string) => setSelectedIssueId(id)}
                            onMapClick={handleMapClick}
                            clickedCoords={clickedCoords}
                          />
                          </ErrorBoundary>"""

if target in content:
    content = content.replace(target, replacement)
    print("Replaced!")
else:
    print("Target not found!")

with open("src/App.tsx", "w") as f:
    f.write(content)
