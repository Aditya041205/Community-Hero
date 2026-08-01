import os

file_path = "src/components/ReportForm.tsx"
with open(file_path, "r") as f:
    content = f.read()

target = """    } catch (err) {
      console.error("Reverse geocoding failed", err);
    }"""
replacement = """    } catch (err) {
      console.warn("Reverse geocoding failed");
    }"""

content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)
