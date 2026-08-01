import re

# App.tsx
with open("src/App.tsx", "r") as f:
    content = f.read()

# Authentication loaded / User loaded / Role loaded
# Inside isAuthorized, we can just add a log in useEffect for user change
log_user = """  useEffect(() => {
    if (!loading) {
      console.log("[DEBUG] Authentication loaded.");
      if (user) {
        console.log(`[DEBUG] User loaded: ${user.name}`);
        console.log(`[DEBUG] Role loaded: ${user.role}`);
      }
    }
  }, [user, loading]);"""

content = content.replace("  const fetchErrorCountRef = useRef(0);", log_user + "\n  const fetchErrorCountRef = useRef(0);")

# Firestore loaded / Complaints loaded
# Inside fetchAllData or onSnapshot
content = content.replace('console.log(`[COMPLAINT-SYNC] Received ${mappedIssues.length} issues from Firestore.`);', 'console.log(`[COMPLAINT-SYNC] Received ${mappedIssues.length} issues from Firestore.`);\n      console.log("[DEBUG] Firestore loaded. Complaints loaded.");')

# Citizen Dashboard rendered
content = content.replace('{dashboardTab === "map" && (', '{console.log("[DEBUG] Citizen Dashboard rendered.")}\n                      {dashboardTab === "map" && (')

with open("src/App.tsx", "w") as f:
    f.write(content)

# InteractiveMap.tsx
with open("src/components/InteractiveMap.tsx", "r") as f:
    map_content = f.read()

map_content = map_content.replace('const filteredIssues = issues.filter(i => {', 'console.log("[DEBUG] Map rendered.");\n  const filteredIssues = issues.filter(i => {')

with open("src/components/InteractiveMap.tsx", "w") as f:
    f.write(map_content)

