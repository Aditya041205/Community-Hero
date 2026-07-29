with open("src/App.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'address: data.address || (typeof data.location === \'string\' ? data.location : ""),',
    'address: data.address || (typeof data.location === \'string\' ? data.location : ""),\n          city: data.city || "",\n          state: data.state || "",\n          country: data.country || "",'
)

with open("src/App.tsx", "w") as f:
    f.write(content)
