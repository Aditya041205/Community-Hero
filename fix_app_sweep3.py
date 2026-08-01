import os

file_path = "src/App.tsx"
with open(file_path, "r") as f:
    content = f.read()

target = 'import { collection, onSnapshot, query, doc, setDoc, updateDoc, arrayUnion, increment } from "firebase/firestore";'
replacement = 'import { collection, onSnapshot, query, doc, setDoc, updateDoc, arrayUnion, increment, getDocs, deleteDoc } from "firebase/firestore";'

content = content.replace(target, replacement)

target2 = 'const { getDocs, deleteDoc, doc, collection } = await import("firebase/firestore");'
replacement2 = ''

content = content.replace(target2, replacement2)

with open(file_path, "w") as f:
    f.write(content)
