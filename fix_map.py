import re

with open("src/components/InteractiveMap.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'position={[issue.location.lat, issue.location.lng]}',
    'position={[issue.latitude || issue.location?.lat || 0, issue.longitude || issue.location?.lng || 0]}'
)
content = content.replace(
    'https://www.google.com/maps?q=${issue.location.lat},${issue.location.lng}',
    'https://www.google.com/maps?q=${issue.latitude || issue.location?.lat || 0},${issue.longitude || issue.location?.lng || 0}'
)
content = content.replace(
    'https://www.google.com/maps/dir/?api=1&destination=${issue.location.lat},${issue.location.lng}',
    'https://www.google.com/maps/dir/?api=1&destination=${issue.latitude || issue.location?.lat || 0},${issue.longitude || issue.location?.lng || 0}'
)
content = content.replace('issue.author', 'issue.reporterName || issue.author || "Anonymous"')

with open("src/components/InteractiveMap.tsx", "w") as f:
    f.write(content)
