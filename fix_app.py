import os

file_path = "src/App.tsx"
with open(file_path, "r") as f:
    content = f.read()

target = """  const handleIssueReported = (newIssue: Issue) => {
    setIssues(prev => [...prev, newIssue]);
    setSelectedIssueId(newIssue?.id ?? '');
    fetchAllData();
    navigate("/citizen");
  };"""

replacement = """  const handleIssueReported = (newIssue: Issue) => {
    // onSnapshot will automatically update issues. Just navigate.
    navigate("/citizen");
  };"""

content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)
