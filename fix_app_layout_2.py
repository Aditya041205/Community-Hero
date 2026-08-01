import os

file_path = "src/App.tsx"
with open(file_path, "r") as f:
    content = f.read()

target = """                              </AnimatePresence>
                            </motion.div>
                          )}
                        </div>
                      )}"""

replacement = """                              </AnimatePresence>
                            </motion.div>
                          )}
                          </div>
                          
                          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex flex-col h-[500px] lg:h-[700px] overflow-hidden">
                            <h3 className="text-white font-bold mb-4 border-b border-white/10 pb-3 text-sm flex justify-between items-center">
                              <span>Complaint List</span>
                              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">{issues.filter(i => i?.status !== "Archived").length}</span>
                            </h3>
                            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                               {issues.filter(i => i?.status !== "Archived").map(issue => (
                                  <div 
                                    key={issue.id} 
                                    onClick={() => setSelectedIssueId(issue.id)}
                                    className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col gap-2 ${selectedIssueId === issue.id ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                  >
                                     <div className="flex justify-between items-start gap-2">
                                       <h4 className="font-bold text-slate-200 text-xs line-clamp-2">{issue.title}</h4>
                                       <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider shrink-0 ${
                                           issue.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-300' : 
                                           issue.status === 'In Progress' ? 'bg-amber-500/10 text-amber-300' :
                                           'bg-white/10 text-slate-400'
                                       }`}>
                                         {issue.status}
                                       </span>
                                     </div>
                                     
                                     <div className="flex justify-between items-center text-[10px]">
                                       <span className="font-mono bg-slate-950 px-1.5 py-0.5 rounded text-slate-400 border border-white/5">{issue.category}</span>
                                       <span className="text-slate-500">{new Date(issue.createdAt).toLocaleDateString()}</span>
                                     </div>

                                     <div className="flex flex-col gap-1 mt-1 text-[10px] text-slate-400">
                                       {issue.address && (
                                         <div className="flex items-center gap-1">
                                           <MapPin size={10} className="text-indigo-400 shrink-0" />
                                           <span className="truncate">{issue.address}</span>
                                         </div>
                                       )}
                                       <div className="flex items-center justify-between mt-1 border-t border-white/5 pt-1">
                                         <span>Reporter: <span className="text-slate-300">{issue.reporterName}</span></span>
                                         <span className={`font-bold ${issue.urgency === 'High' ? 'text-red-400' : issue.urgency === 'Medium' ? 'text-amber-400' : 'text-emerald-400'}`}>{issue.urgency}</span>
                                       </div>
                                     </div>

                                     {issue.image && (
                                       <img src={issue.image} alt={issue.title} className="w-full h-24 object-cover rounded-lg border border-white/10 mt-1" referrerPolicy="no-referrer" />
                                     )}
                                  </div>
                               ))}
                            </div>
                          </div>
                          
                        </div>
                      )}"""

content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)
