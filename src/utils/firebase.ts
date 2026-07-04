import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocFromServer 
} from 'firebase/firestore';
import { Property, User, Message, Invoice, AuditLog } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyCQDrHWWxPDaxgoj0r_IyQAPnVO2g_G4-8",
  authDomain: "gen-lang-client-0448692397.firebaseapp.com",
  projectId: "gen-lang-client-0448692397",
  storageBucket: "gen-lang-client-0448692397.firebasestorage.app",
  messagingSenderId: "106377198023",
  appId: "1:106377198023:web:42cd2cfde2efb307df41e2"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the custom database ID from configuration
export const db = getFirestore(app, "ai-studio-253cf87b-733e-4821-88f9-54ee91df4b5d");

// Validate connection to Firestore as requested by the guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test_connection_coll', 'test_doc_id'));
    console.log("Firebase Firestore connection verified successfully!");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Firebase is offline. Please check your network or configuration.");
    } else {
      console.warn("Firestore connection check bypassed or initializing:", error);
    }
  }
}
testConnection();

// Generic helpers for Firestore collections
export async function getCollectionData<T>(collectionName: string): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    const data: T[] = [];
    snapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() } as unknown as T);
    });
    return data;
  } catch (error) {
    console.error(`Error fetching collection ${collectionName} from Firestore:`, error);
    throw error;
  }
}

export async function saveDocument<T extends { id: string }>(collectionName: string, item: T): Promise<void> {
  try {
    const docRef = doc(db, collectionName, item.id);
    // Remove the id from the payload to avoid duplicate ID fields if desired,
    // but saving it inside the document is standard and harmless
    await setDoc(docRef, item);
  } catch (error) {
    console.error(`Error saving document in ${collectionName}:`, error);
    throw error;
  }
}

export async function updateDocumentFields(collectionName: string, id: string, fields: Record<string, any>): Promise<void> {
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, fields);
  } catch (error) {
    console.error(`Error updating document ${id} in ${collectionName}:`, error);
    throw error;
  }
}

export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document ${id} from ${collectionName}:`, error);
    throw error;
  }
}

// Seeding helper to initialize empty Firestore collections with default data on very first boot
export async function seedFirestoreIfEmpty(
  initialProperties: Property[],
  initialUsers: User[],
  initialMessages: Message[],
  initialInvoices: Invoice[],
  initialAuditLogs: AuditLog[]
): Promise<{
  properties: Property[];
  users: User[];
  messages: Message[];
  invoices: Invoice[];
  auditLogs: AuditLog[];
}> {
  try {
    // 1. Properties
    let finalProperties = await getCollectionData<Property>('properties');
    if (finalProperties.length === 0) {
      console.log('Seeding initial properties to cloud Firestore...');
      for (const p of initialProperties) {
        await saveDocument('properties', p);
      }
      finalProperties = initialProperties;
    }

    // 2. Users
    let finalUsers = await getCollectionData<User>('users');
    if (finalUsers.length === 0) {
      console.log('Seeding initial users to cloud Firestore...');
      for (const u of initialUsers) {
        await saveDocument('users', u);
      }
      finalUsers = initialUsers;
    }

    // 3. Messages
    let finalMessages = await getCollectionData<Message>('messages');
    if (finalMessages.length === 0) {
      console.log('Seeding initial messages to cloud Firestore...');
      for (const m of initialMessages) {
        await saveDocument('messages', m);
      }
      finalMessages = initialMessages;
    }

    // 4. Invoices
    let finalInvoices = await getCollectionData<Invoice>('invoices');
    if (finalInvoices.length === 0) {
      console.log('Seeding initial invoices to cloud Firestore...');
      for (const i of initialInvoices) {
        await saveDocument('invoices', i);
      }
      finalInvoices = initialInvoices;
    }

    // 5. Audit Logs
    let finalAuditLogs = await getCollectionData<AuditLog>('auditLogs');
    if (finalAuditLogs.length === 0) {
      console.log('Seeding initial audit logs to cloud Firestore...');
      for (const log of initialAuditLogs) {
        await saveDocument('auditLogs', log);
      }
      finalAuditLogs = initialAuditLogs;
    }

    return {
      properties: finalProperties,
      users: finalUsers,
      messages: finalMessages,
      invoices: finalInvoices,
      auditLogs: finalAuditLogs
    };
  } catch (error) {
    console.error('Error seeding Firestore data:', error);
    // Return empty defaults or original parameters if seed fails
    return {
      properties: initialProperties,
      users: initialUsers,
      messages: initialMessages,
      invoices: initialInvoices,
      auditLogs: initialAuditLogs
    };
  }
}
