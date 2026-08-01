with open("src/components/IssueTimeline.tsx", "r") as f:
    content = f.read()

content = content.replace("completedEvents.map((event, index) => {", "completedEvents.map((event, index) => { if (!event) return null;")
content = content.replace("pendingStatuses.map((status, index) => {", "pendingStatuses.map((status, index) => { if (!status) return null;")

with open("src/components/IssueTimeline.tsx", "w") as f:
    f.write(content)
