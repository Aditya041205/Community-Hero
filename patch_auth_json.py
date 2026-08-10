import os

file_path = "src/components/AuthContext.tsx"
with open(file_path, "r") as f:
    content = f.read()

target = """          if (syncRes.ok) {
            const data = await syncRes.json();
            
            // Persist Express JWT token locally
            localStorage.setItem("ch_token", data.token);

            setState({
              user: data.user,
              token: data.token,
              loading: false,
              error: null
            });
          } else {
            const errorData = await syncRes.json();
            console.error("[AUTH-CLIENT] Failed to sync user with backend:", errorData);
            
            setState({
              user: null,
              token: null,
              loading: false,
              error: errorData.error || "Failed to synchronize profile with server."
            });
          }"""

replacement = """          const responseText = await syncRes.text();
          let parsedData: any = {};
          try {
            parsedData = responseText ? JSON.parse(responseText) : {};
          } catch (parseError) {
            console.error("[AUTH-CLIENT] Failed to parse backend response as JSON:", responseText);
          }

          if (syncRes.ok) {
            // Persist Express JWT token locally
            if (parsedData.token) {
              localStorage.setItem("ch_token", parsedData.token);
            }

            setState({
              user: parsedData.user || null,
              token: parsedData.token || null,
              loading: false,
              error: null
            });
          } else {
            console.error("[AUTH-CLIENT] Failed to sync user with backend:", parsedData);
            
            setState({
              user: null,
              token: null,
              loading: false,
              error: parsedData.error || "Failed to synchronize profile with server."
            });
          }"""

content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)
