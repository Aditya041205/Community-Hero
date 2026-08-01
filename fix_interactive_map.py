import os

file_path = "src/components/InteractiveMap.tsx"
with open(file_path, "r") as f:
    content = f.read()

target = """            {filteredIssues.map(issue => !issue ? null : (
              <Marker
                key={issue?.id}
                position={[issue?.latitude || issue?.location?.lat || 0, issue?.longitude || issue?.location?.lng || 0]}"""

replacement = """            {filteredIssues.map(issue => {
              if (!issue) return null;
              const lat = issue.latitude ?? issue.location?.lat;
              const lng = issue.longitude ?? issue.location?.lng;
              if (lat === undefined || lng === undefined || lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
                return null; // Skip marker if coordinates are missing
              }
              return (
              <Marker
                key={issue?.id}
                position={[lat, lng]}"""

content = content.replace(target, replacement)

target2 = """                      <button
                         onClick={(e) => {
                           e.stopPropagation();
                           onSelectIssueId(issue?.id);
                         }}
                         className="w-full mt-2 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold rounded flex items-center justify-center transition-colors"
                       >
                         View Details
                       </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>"""

replacement2 = """                      <button
                         onClick={(e) => {
                           e.stopPropagation();
                           onSelectIssueId(issue?.id);
                         }}
                         className="w-full mt-2 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold rounded flex items-center justify-center transition-colors"
                       >
                         View Details
                       </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            )
            })}
          </MarkerClusterGroup>"""

content = content.replace(target2, replacement2)

with open(file_path, "w") as f:
    f.write(content)
