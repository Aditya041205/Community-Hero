with open("src/components/AuthorityPanel.tsx", "r") as f:
    content = f.read()

content = content.replace("filteredIssues.map(issue => {", "filteredIssues.map(issue => { if (!issue) return null;")
content = content.replace("squadOptions.map(opt => (", "squadOptions.map(opt => !opt ? null : (")

with open("src/components/AuthorityPanel.tsx", "w") as f:
    f.write(content)
