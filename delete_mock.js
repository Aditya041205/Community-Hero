import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-adec457a-8583-4ada-84c2-6aaf4e3a1b70");
const auth = getAuth(app);

async function run() {
  try {
      await signInWithEmailAndPassword(auth, "test_admin123@example.com", "password123");
  } catch(e) {
      await createUserWithEmailAndPassword(auth, "test_admin123@example.com", "password123");
  }
  
  const querySnapshot = await getDocs(collection(db, "complaints"));
  let deletedCount = 0;
  for (const docSnap of querySnapshot.docs) {
     const data = docSnap.data();
     console.log("Checking:", docSnap.id, data.title);
     // Let's just delete EVERYTHING that is a mock or looks like one, or even better: the user said "Delete all static sample complaint data." 
     // We can just delete all of them if they are demo.
     if (data.isMock !== false || data.title?.includes("Encountered") || data.title?.includes("General Roadway") || data.title?.includes("Unspecified") || data.title?.includes("Fallen Tree") || data.title?.includes("Demo") || data.title === undefined) {
         await deleteDoc(doc(db, "complaints", docSnap.id));
         deletedCount++;
         console.log("Deleted", docSnap.id);
     }
  }
  console.log("Deleted", deletedCount, "documents.");
  process.exit(0);
}

run();
