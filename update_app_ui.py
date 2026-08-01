import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Add empty state to Map dashboard tab
map_replacement = '''{issues.filter(i => i?.status !== "Closed").length === 0 ? (
                            <div className="bg-slate-900/60 p-8 rounded-3xl border border-white/10 text-center text-slate-400 flex flex-col items-center justify-center h-[500px]">
                               <p className="font-bold text-lg">No complaints found.</p>
                            </div>
                          ) : (
                            <InteractiveMap'''

content = content.replace('<InteractiveMap', map_replacement, 1)
content = content.replace('clickedCoords={clickedCoords}\n                          />', 'clickedCoords={clickedCoords}\n                          />\n                          )}')


# Add "Unable to load profile." if user data is somehow missing
# We'll just wrap the whole profile widget content
profile_widget_start = '{/* Profile Widget */}'
profile_widget_code = '''{/* Profile Widget */}
                {!user?.id ? (
                  <div className="flex items-center justify-center bg-slate-950/40 p-3 rounded-2xl border border-white/5 text-slate-400 text-xs text-center">Unable to load profile.</div>
                ) : (
                <div className="flex items-center space-x-3 bg-slate-950/40 p-3 rounded-2xl border border-white/5">'''
content = content.replace('{/* Profile Widget */}\n                <div className="flex items-center space-x-3 bg-slate-950/40 p-3 rounded-2xl border border-white/5">', profile_widget_code)

content = content.replace('</div>\n                {/* Score badge widget */}', '</div>\n                )}\n                {/* Score badge widget */}')

with open("src/App.tsx", "w") as f:
    f.write(content)
