with open("src/components/ResolvedComplaintsPage.tsx", "r") as f:
    content = f.read()

content = content.replace("filteredIssues.map(issue => (", "filteredIssues.map(issue => !issue ? null : (")
content = content.replace("filteredIssues.map(i => [", "filteredIssues.filter(i => !!i).map(i => [")

with open("src/components/ResolvedComplaintsPage.tsx", "w") as f:
    f.write(content)
