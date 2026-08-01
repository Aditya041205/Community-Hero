with open("src/components/InteractiveMap.tsx", "r") as f:
    content = f.read()

content = content.replace("issue.id", "issue?.id")
content = content.replace("key={issue.id}", "key={issue?.id || Math.random().toString()}")
content = content.replace("onSelectIssueId(issue.id)", "if (issue?.id) onSelectIssueId(issue.id)")

with open("src/components/InteractiveMap.tsx", "w") as f:
    f.write(content)
