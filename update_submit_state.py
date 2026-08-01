import os

file_path = "src/components/ReportForm.tsx"
with open(file_path, "r") as f:
    content = f.read()

target = """    } catch (error: any) {
      setErrorStatus(error.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }"""

replacement = """    } catch (error: any) {
      setErrorStatus(error.message || "Failed to submit report");
      setSubmitting(false);
    }
    // We do NOT call setSubmitting(false) on success because we want the spinner/disabled state to remain while redirecting."""

content = content.replace(target, replacement)

target2 = """        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 border border-white/10 text-white rounded-xl font-bold font-display hover:brightness-110 active:translate-y-0.5 disabled:opacity-50 shadow-md shadow-indigo-500/15 transition flex items-center justify-center space-x-1.5 cursor-pointer z-10 relative"
        >"""

replacement2 = """        <button
          type="submit"
          disabled={submitting || !!reportResult}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 border border-white/10 text-white rounded-xl font-bold font-display hover:brightness-110 active:translate-y-0.5 disabled:opacity-50 shadow-md shadow-indigo-500/15 transition flex items-center justify-center space-x-1.5 cursor-pointer z-10 relative"
        >"""

content = content.replace(target2, replacement2)

with open(file_path, "w") as f:
    f.write(content)
