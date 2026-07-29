with open("src/components/InteractiveMap.tsx", "r") as f:
    content = f.read()

content = content.replace('const [filterStatus, setFilterStatus] = useState<string>("All");', 
'''const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterUrgency, setFilterUrgency] = useState<string>("All");''')

content = content.replace('const filteredIssues = issues.filter(i => filterStatus === "All" ? true : i.status === filterStatus);',
'''const filteredIssues = issues.filter(i => {
    const matchStatus = filterStatus === "All" || i.status === filterStatus || (filterStatus === "Pending" && i.status === "Reported"); // Handle Reported as Pending
    const matchCategory = filterCategory === "All" || i.category === filterCategory;
    const matchUrgency = filterUrgency === "All" || i.urgency === filterUrgency;
    return matchStatus && matchCategory && matchUrgency;
  });''')

filter_ui = '''<div className="absolute top-4 left-4 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl p-2 shadow-xl flex gap-2">
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-800 border border-slate-600 text-white text-xs rounded-lg px-2 py-1 outline-none"
          >
            <option value="All">All Complaints</option>
            <option value="Pending">Pending / Reported</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Archived">Archived</option>
          </select>'''
          
new_filter_ui = '''<div className="absolute top-4 left-4 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl p-2 shadow-xl flex flex-wrap gap-2 max-w-[calc(100%-60px)]">
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-800 border border-slate-600 text-white text-xs rounded-lg px-2 py-1 outline-none cursor-pointer"
          >
            <option value="All">Status: All</option>
            <option value="Pending">Pending / Reported</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Archived">Archived</option>
          </select>
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-800 border border-slate-600 text-white text-xs rounded-lg px-2 py-1 outline-none cursor-pointer"
          >
            <option value="All">Category: All</option>
            <option value="Garbage accumulation">Garbage</option>
            <option value="Potholes">Potholes</option>
            <option value="Water leakage">Water Leakage</option>
            <option value="Street light issues">Street Lights</option>
            <option value="Drainage blockage">Drainage</option>
            <option value="Abandoned vehicles">Vehicles</option>
            <option value="Other">Other</option>
          </select>
          <select 
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value)}
            className="bg-slate-800 border border-slate-600 text-white text-xs rounded-lg px-2 py-1 outline-none cursor-pointer"
          >
            <option value="All">Urgency: All</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>'''

content = content.replace(filter_ui, new_filter_ui)

with open("src/components/InteractiveMap.tsx", "w") as f:
    f.write(content)
