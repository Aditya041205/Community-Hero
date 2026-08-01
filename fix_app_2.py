with open("src/App.tsx", "r") as f:
    content = f.read()

content = content.replace("i.id", "i?.id")
content = content.replace("c.id", "c?.id")

with open("src/App.tsx", "w") as f:
    f.write(content)
