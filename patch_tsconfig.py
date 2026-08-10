import os
import json

file_path = "tsconfig.json"
with open(file_path, "r") as f:
    config = json.load(f)

if "include" not in config:
    config["include"] = ["src"]

with open(file_path, "w") as f:
    json.dump(config, f, indent=2)

