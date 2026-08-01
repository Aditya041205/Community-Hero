with open("src/App.tsx", "r") as f:
    content = f.read()

if "import { ErrorBoundary }" not in content:
    content = content.replace('import { useAuth } from "./components/AuthContext";', 'import { useAuth } from "./components/AuthContext";\nimport { ErrorBoundary } from "./components/ErrorBoundary";')

with open("src/App.tsx", "w") as f:
    f.write(content)
