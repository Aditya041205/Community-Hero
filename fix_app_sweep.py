import os

file_path = "src/App.tsx"
with open(file_path, "r") as f:
    content = f.read()

target = """  useEffect(() => {
    if (!user) return;

    console.log("[COMPLAINT-SYNC] Subscribing to Firestore complaints onSnapshot...");"""

replacement = """  useEffect(() => {
    if (!user) return;

    console.log("[COMPLAINT-SYNC] Subscribing to Firestore complaints onSnapshot...");
    
    // ONE-TIME SWEEP OF MOCK DATA
    (async () => {
       try {
           const { getDocs, deleteDoc, doc, collection } = await import("firebase/firestore");
           const snap = await getDocs(collection(db, "complaints"));
           for (const d of snap.docs) {
               const data = d.data();
               if (data.isMock !== false || !data.title || data.title.includes("Encountered") || data.title.includes("General Roadway") || data.title.includes("Unspecified") || data.title.includes("Fallen Tree") || data.title.includes("Demo") || data.isMock === true) {
                   await deleteDoc(doc(db, "complaints", d.id));
                   console.log("Deleted mock doc:", d.id);
               }
           }
       } catch (e) {
           console.error("Failed sweep:", e);
       }
    })();"""

content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)
