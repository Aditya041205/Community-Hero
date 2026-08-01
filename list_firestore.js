import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function listDocs() {
  const querySnapshot = await getDocs(collection(db, "complaints"));
  querySnapshot.forEach((doc) => {
    console.log(`${doc.id} => ${doc.data().title} (isMock: ${doc.data().isMock})`);
  });
  process.exit(0);
}

listDocs();
