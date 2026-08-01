with open("src/App.tsx", "r") as f:
    content = f.read()

content = content.replace("selectedIssue.comments.map(c => (", "selectedIssue?.comments?.map(c => !c ? null : (")

with open("src/App.tsx", "w") as f:
    f.write(content)
