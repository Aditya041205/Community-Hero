import os

file_path = "src/components/ReportForm.tsx"
with open(file_path, "r") as f:
    content = f.read()

target1 = """              const fetchPromise = fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
              const res = await withTimeout(fetchPromise, 5000, "reverse geocoder");"""

replacement1 = """              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 5000);
              const fetchPromise = fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, { signal: controller.signal });
              const res = await withTimeout(fetchPromise, 5000, "reverse geocoder");
              clearTimeout(timeoutId);"""

content = content.replace(target1, replacement1)

target2 = """              const fetchPromise = fetch("/api/issues/report", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify(payload)
              });
              const res = await withTimeout(fetchPromise, 10000, "AI API");"""

replacement2 = """              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 10000);
              const fetchPromise = fetch("/api/issues/report", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify(payload),
                signal: controller.signal
              });
              const res = await withTimeout(fetchPromise, 10000, "AI API");
              clearTimeout(timeoutId);"""

content = content.replace(target2, replacement2)

with open(file_path, "w") as f:
    f.write(content)
