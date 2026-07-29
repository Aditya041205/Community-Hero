with open("src/types.ts", "r") as f:
    content = f.read()

content = content.replace('status: "Reported" | "Verified" | "Assigned" | "In Progress" | "Resolved" | "Closed";', 'status: "Pending" | "Reported" | "Verified" | "Assigned" | "In Progress" | "Resolved" | "Closed" | "Archived";')

with open("src/types.ts", "w") as f:
    f.write(content)
