import os
import glob

for file_path in glob.glob("src/**/*.tsx", recursive=True):
    with open(file_path, "r") as f:
        content = f.read()
    
    if 'fetch("/api/' in content:
        content = content.replace('fetch("/api/', 'fetch((import.meta.env.VITE_API_URL || "") + "/api/')
        with open(file_path, "w") as f:
            f.write(content)

