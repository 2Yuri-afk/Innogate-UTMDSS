import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore'; // Import doc and getDoc
import { getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDyFvxkmOFdT6wUJN5IgPryod5cvx6rVco',
  authDomain: 'thesismanagementsystem-39688.firebaseapp.com',
  projectId: 'thesismanagementsystem-39688',
  storageBucket: 'thesismanagementsystem-39688.appspot.com',
  messagingSenderId: '344707455909',
  appId: '1:344707455909:web:782f0865d92dd4d12fa64c',
  measurementId: 'G-RETHEZ24WR',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Auth
const db = getFirestore(app);
const auth = getAuth(app);

// Function to get user role
export const getUserRole = async (userId) => {
  const userDoc = doc(db, 'users', userId); // Assuming user roles are stored in a 'users' collection
  const userSnapshot = await getDoc(userDoc);
  if (userSnapshot.exists()) {
    return userSnapshot.data().role; // Adjust this according to your Firestore structure
  }
  return null; // Return null if the user does not exist
};

// Function to get user groupID
export const getUserGroupID = async (userId) => {
  const userDoc = doc(db, 'users', userId); // Reference to the user's document
  const userSnapshot = await getDoc(userDoc);
  if (userSnapshot.exists()) {
    return userSnapshot.data().groupID; // Assuming the field name is 'groupID'
  }
  return null; // Return null if the user does not exist
};

export const rejectProposal = async (proposalId, rejectionReason) => {
  const proposalRef = doc(db, 'proposals', proposalId); // Reference to the proposal document

  try {
    // Update the proposal's status to rejected and store the rejection reason
    await updateDoc(proposalRef, {
      status: 'rejected',
      rejectionReason: rejectionReason,
    });
    console.log('Proposal rejected successfully.');
  } catch (error) {
    console.error('Error rejecting proposal: ', error);
  }
};

// Set the persistence for Firebase Auth to sessionPersistence
setPersistence(auth, browserSessionPersistence)
  .then(() => {
    // Existing and future Auth states are now persisted in the current session only.
  })
  .catch((error) => {
    console.error('Error setting persistence: ', error);
  });

const storage = getStorage(app);

export { db, auth, storage };
