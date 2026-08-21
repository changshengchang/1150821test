import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, collection, addDoc, serverTimestamp, getDocs, deleteDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); // CRITICAL
export const auth = getAuth(app);

// Helper for testing connection
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function submitSurvey(data: {
  department: string;
  name: string;
  answers: Record<string | number, string>;
  score: number;
  signatureData: string;
}) {
  const pathForWrite = 'survey_responses';
  try {
    const stringAnswers: Record<string, string> = {};
    Object.entries(data.answers).forEach(([k, v]) => {
      stringAnswers[String(k)] = String(v);
    });

    const submitPromise = addDoc(collection(db, pathForWrite), {
      department: data.department,
      name: data.name,
      answers: stringAnswers,
      score: data.score,
      signatureData: data.signatureData,
      createdAt: serverTimestamp(),
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('網路連線逾時，請確認連線正常後重試')), 15000)
    );

    await Promise.race([submitPromise, timeoutPromise]);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, pathForWrite);
  }
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Error signing in with Google", error);
  }
}

export async function logout() {
  try {
    await auth.signOut();
  } catch (error) {
    console.error("Error signing out", error);
  }
}

export async function getSurveyResponses() {
  const q = collection(db, 'survey_responses');
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function deleteSurveyResponse(id: string) {
  const docRef = doc(db, 'survey_responses', id);
  await deleteDoc(docRef);
}
