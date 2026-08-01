import os
import glob

for filepath in glob.glob("src/components/*.tsx"):
    with open(filepath, "r") as f:
        content = f.read()

    # Generic replaces for strict null checks
    content = content.replace("i.id", "i?.id")
    content = content.replace("u.id", "u?.id")
    content = content.replace("issue.id", "issue?.id")
    content = content.replace("auth.id", "auth?.id")
    content = content.replace("c.id", "c?.id")
    content = content.replace("event.id", "event?.id")
    content = content.replace("entry.id", "entry?.id")
    
    with open(filepath, "w") as f:
        f.write(content)

