import os

file_path = "src/components/ReportForm.tsx"
with open(file_path, "r") as f:
    content = f.read()

target = """      setReportResult({ 
        title: title || "Issue Reported", 
        urgency: "Medium",
        duplicateOfId: null,
        duplicateReason: "",
        recommendation: ""
      });
      
      setTitle("");
      setDescription("");
      setImage(null);
      
      setTimeout(() => {
        onIssueReported({ id: docRef.id, title, category, status: "Pending AI" } as any);
      }, 500);
    } catch (error: any) {"""

replacement = """      setReportResult({ 
        title: title || "Issue Reported", 
        urgency: "Medium",
        duplicateOfId: null,
        duplicateReason: "",
        recommendation: ""
      });
      
      setTitle("");
      setDescription("");
      setImage(null);
      console.timeEnd("Complaint Submit");
      
      setTimeout(() => {
        onIssueReported({ id: docRef.id, title, category, status: "Pending AI" } as any);
      }, 500);
    } catch (error: any) {"""

content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)
