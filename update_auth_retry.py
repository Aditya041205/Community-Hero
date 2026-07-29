with open("src/components/AuthContext.tsx", "r") as f:
    content = f.read()

sync_code = """
          // Synchronize with our backend to retrieve role & local JWT
          const syncRes = await fetch("/api/auth/firebase-sync", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Civic Connect User",
              role: role
            })
          });"""

sync_code_retry = """
          // Synchronize with our backend to retrieve role & local JWT
          let syncRes;
          let retries = 3;
          while (retries > 0) {
            try {
              syncRes = await fetch("/api/auth/firebase-sync", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Civic Connect User",
                  role: role
                })
              });
              break; // Success
            } catch (err) {
              retries--;
              if (retries === 0) throw err;
              await new Promise(resolve => setTimeout(resolve, 1500)); // wait 1.5s before retry
            }
          }
          if (!syncRes) throw new Error("Failed to fetch after retries");
"""

if sync_code in content:
    content = content.replace(sync_code, sync_code_retry)
else:
    print("Could not find sync_code to replace")

with open("src/components/AuthContext.tsx", "w") as f:
    f.write(content)
