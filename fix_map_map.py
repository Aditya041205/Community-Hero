with open("src/components/InteractiveMap.tsx", "r") as f:
    content = f.read()

content = content.replace("filteredIssues.map(issue => (", "filteredIssues.map(issue => !issue ? null : (")

with open("src/components/InteractiveMap.tsx", "w") as f:
    f.write(content)
