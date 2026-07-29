with open("src/types.ts", "r") as f:
    content = f.read()

content = content.replace("address: string;", "address: string;\n  city: string;\n  state: string;\n  country: string;\n  author?: string;")

with open("src/types.ts", "w") as f:
    f.write(content)
