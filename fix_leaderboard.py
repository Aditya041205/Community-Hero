with open("src/components/LeaderboardGamification.tsx", "r") as f:
    content = f.read()

content = content.replace("entries.map((entry, index) => {", "entries.map((entry, index) => { if (!entry) return null;")
content = content.replace("badgePool.map(badge => {", "badgePool.map(badge => { if (!badge) return null;")

with open("src/components/LeaderboardGamification.tsx", "w") as f:
    f.write(content)
