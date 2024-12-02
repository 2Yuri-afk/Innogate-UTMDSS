import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from 'src/backend/firebase'

export const fetchGroups = async () => {
  const usersCollection = collection(db, 'users')
  const usersSnapshot = await getDocs(usersCollection)
  const groupIDs = [...new Set(usersSnapshot.docs.map((doc) => doc.data().groupID))]
  return groupIDs.filter(Boolean) // Filter out undefined or null group IDs
}

export const fetchMembersByGroup = async (groupID) => {
  try {
    const membersRef = collection(db, 'users') // Assuming 'students' is your Firestore collection
    const membersQuery = query(membersRef, where('groupID', '==', groupID))
    const querySnapshot = await getDocs(membersQuery)

    const members = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      photoURL: doc.photoURL,
      ...doc.data(),
    }))

    return members
  } catch (error) {
    console.error('Error fetching members by group:', error)
    return []
  }
}
