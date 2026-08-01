import os
import sys

file_path = "src/components/ReportForm.tsx"
with open(file_path, "r") as f:
    content = f.read()

target = """          <div className="flex items-center space-x-2 font-bold font-display">
            <span>{reportResult.duplicateOfId ? "🔄 Proximity Anti-Duplicate Triggered" : "🎉 Ticket Dispatched Successfully!"}</span>
          </div>
          <p className="text-[11px] text-slate-350">
            {reportResult.duplicateOfId
              ? `Note: ${reportResult.duplicateReason}`
              : `Complaint identified as "${reportResult.title}" (Urgency: ${reportResult.urgency}).`
            }
          </p>"""

replacement = """          <div className="flex items-center space-x-2 font-bold font-display">
            <span>✅ Complaint submitted successfully</span>
          </div>
          <p className="text-[11px] text-slate-350">
            Redirecting to dashboard...
          </p>"""

content = content.replace(target, replacement)

target2 = """            <>
              <RefreshCw className="animate-spin" size={14} />
              <span>Submitting...</span>
            </>"""
replacement2 = """            <>
              <RefreshCw className="animate-spin" size={14} />
              <span>Submitting Complaint...</span>
            </>"""

content = content.replace(target2, replacement2)

with open(file_path, "w") as f:
    f.write(content)
