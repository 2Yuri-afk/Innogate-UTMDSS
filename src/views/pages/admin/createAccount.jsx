import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormInput,
  CFormSelect,
  CRow,
  CCol,
  CImage,
  CTable,
  CTableBody,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CTableDataCell,
  CSpinner,
} from '@coreui/react'
import {
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { db, auth } from 'src/backend/firebase'
import CustomToast from 'src/components/Toast/CustomToast'

const defaultProfilePic = 'src/assets/images/avatars/pic.png'

const CreateAccount = () => {
  const [users, setUsers] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [passwordModalVisible, setPasswordModalVisible] = useState(false)
  const [deleteConfirmModalVisible, setDeleteConfirmModalVisible] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [password, setPassword] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const [toast, setToast] = useState(null)
  const [maxTeacherID, setMaxTeacherID] = useState(0) // Track highest teacherID
  const [maxAdviserID, setMaxAdviserID] = useState(0) // Track highest adviserID
  const [selectedUserToDelete, setSelectedUserToDelete] = useState(null) // New state for selected user for deletion

  // START OF HIGHLIGHTED CODE FOR DELETION AFTER FIRST RUN
  useEffect(() => {
    const addFileContainersToExistingStudents = async () => {
      const studentsQuery = query(collection(db, 'users'), where('role', '==', 'Student'))
      const studentsSnapshot = await getDocs(studentsQuery)

      studentsSnapshot.forEach(async (studentDoc) => {
        const studentData = studentDoc.data()

        // Check if file container already exists
        if (!studentData.fileContainer) {
          await updateDoc(doc(db, 'users', studentDoc.id), {
            fileContainer: {
              file: null,
              uploadedAt: null,
            },
          })
        }
      })
    }

    addFileContainersToExistingStudents()
  }, [])
  // END OF HIGHLIGHTED CODE FOR DELETION AFTER FIRST RUN

  useEffect(() => {
    const fetchUsers = async () => {
      const querySnapshot = await getDocs(collection(db, 'users'))
      const usersList = querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }))

      // Get the highest teacherID and adviserID
      let maxTeacherID = 0
      let maxAdviserID = 0

      usersList.forEach((user) => {
        if (user.role === 'Teacher' && user.teacherID) {
          maxTeacherID = Math.max(maxTeacherID, parseInt(user.teacherID, 10))
        }
        if (user.role === 'Adviser' && user.adviserID) {
          maxAdviserID = Math.max(maxAdviserID, parseInt(user.adviserID, 10))
        }
      })

      setMaxTeacherID(maxTeacherID)
      setMaxAdviserID(maxAdviserID)
      setUsers(usersList)
    }

    fetchUsers()
  }, [])

  const handleAddUser = async () => {
    setLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      await signInWithEmailAndPassword(auth, adminEmail, adminPassword)

      // Generate next IDs
      let newTeacherID = maxTeacherID + 1
      let newAdviserID = maxAdviserID + 1

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name,
        email,
        role,
        photoURL: defaultProfilePic,
        ...(role === 'Adviser' && { adviserID: newAdviserID.toString() }), // Assign new adviserID
        ...(role === 'Teacher' && { teacherID: newTeacherID.toString() }), // Assign new teacherID
        ...(role === 'Student' && {
          groupID: '', // Placeholder for group ID, if grouping is used
          myTeacher: '', // Placeholder, can be updated later
          myAdviser: '', // Placeholder, can be updated later
          fileContainer: {
            file: null,
            uploadedAt: null,
          },
        }),
      })

      setUsers([...users, { id: user.uid, name, email, role, photoURL: defaultProfilePic }])
      setName('')
      setEmail('')
      setRole('')
      setPassword('')
      setModalVisible(false)
      setPasswordModalVisible(false)

      // Increment maxTeacherID or maxAdviserID if applicable
      if (role === 'Teacher') {
        setMaxTeacherID(newTeacherID)
      } else if (role === 'Adviser') {
        setMaxAdviserID(newAdviserID)
      }

      setToast({
        color: 'success',
        message: `User ${name} created successfully!`,
      })
    } catch (error) {
      console.error('Error adding user: ', error.message)

      setToast({
        color: 'danger',
        message: `Error: ${error.message}`,
      })
    } finally {
      setLoading(false)
    }
  }

  const confirmAddUser = () => {
    const currentUser = auth.currentUser
    setAdminEmail(currentUser.email)
    setPasswordModalVisible(true)
    setModalVisible(false)
  }

  const handleDeleteUserConfirmation = (user) => {
    setSelectedUserToDelete(user)
    setDeleteConfirmModalVisible(true)
  }

  const handleDeleteUser = async () => {
    setLoading(true)
    try {
      await deleteDoc(doc(db, 'users', selectedUserToDelete.id))
      setUsers(users.filter((user) => user.id !== selectedUserToDelete.id))
      setDeleteConfirmModalVisible(false)

      setToast({
        color: 'warning',
        message: `User ${selectedUserToDelete.name} deleted successfully!`,
      })
    } catch (error) {
      setToast({
        color: 'danger',
        message: `Error: ${error.message}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <CCard className="mb-3">
      <CCardHeader>
        <div className="d-flex justify-content-between align-items-center">
          <h5>Users</h5>
          <CButton onClick={() => setModalVisible(true)} color="primary">
            Add User
          </CButton>
        </div>
      </CCardHeader>
      <CCardBody>
        <CTable hover responsive small striped>
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell scope="col" style={{ width: '30%' }}>
                Name
              </CTableHeaderCell>
              <CTableHeaderCell scope="col" style={{ width: '30%' }}>
                Email
              </CTableHeaderCell>
              <CTableHeaderCell scope="col" style={{ width: '25%' }}>
                Role
              </CTableHeaderCell>
              <CTableHeaderCell scope="col" style={{ width: '15%' }}>
                Actions
              </CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {users.length === 0 ? (
              <CTableRow>
                <CTableDataCell colSpan={4} className="text-center">
                  No users added yet.
                </CTableDataCell>
              </CTableRow>
            ) : (
              users.map((user, index) => (
                <CTableRow key={index}>
                  <CTableDataCell style={{ width: '30%' }}>
                    <CImage
                      src={user.photoURL || defaultProfilePic}
                      width={30}
                      height={30}
                      alt="Profile Picture"
                      className="me-3"
                      style={{
                        border: '1px solid gray',
                        borderRadius: '15px',
                      }}
                    />
                    <span className="small">{user.name}</span>
                  </CTableDataCell>
                  <CTableDataCell style={{ width: '35%' }}>
                    <span className="small">{user.email}</span>
                  </CTableDataCell>
                  <CTableDataCell style={{ width: '15%' }}>
                    <span className="small">{user.role}</span>
                  </CTableDataCell>
                  <CTableDataCell style={{ width: '20%' }}>
                    <CButton
                      size="sm"
                      color="danger"
                      onClick={() => handleDeleteUserConfirmation(user)}
                    >
                      Delete
                    </CButton>
                  </CTableDataCell>
                </CTableRow>
              ))
            )}
          </CTableBody>
        </CTable>
      </CCardBody>

      {/* Add User Modal */}
      <CModal visible={modalVisible} onClose={() => setModalVisible(false)}>
        <CModalHeader>
          <CModalTitle>Add User</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CFormInput
              type="text"
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <CFormInput
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <CFormSelect
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="" disabled>
                Select role
              </option>
              <option value="Student">Student</option>
              <option value="Teacher">Teacher</option>
              <option value="Adviser">Adviser</option>
              <option value="Admin">Admin</option>
            </CFormSelect>
            <CFormInput
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setModalVisible(false)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={confirmAddUser} disabled={loading}>
            {loading ? (
              <>
                <CSpinner size="sm" /> Save
              </>
            ) : (
              'Save'
            )}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Password Confirmation Modal */}
      <CModal visible={passwordModalVisible} onClose={() => setPasswordModalVisible(false)}>
        <CModalHeader>
          <CModalTitle>Confirm Password</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CFormInput
            type="password"
            label="Admin Password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
          />
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setPasswordModalVisible(false)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleAddUser} disabled={loading}>
            {loading ? (
              <>
                <CSpinner size="sm" /> Confirm
              </>
            ) : (
              'Confirm'
            )}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Delete Confirmation Modal */}
      <CModal
        visible={deleteConfirmModalVisible}
        onClose={() => setDeleteConfirmModalVisible(false)}
      >
        <CModalHeader>
          <CModalTitle>Confirm Deletion</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Are you sure you want to delete user <strong>{selectedUserToDelete?.name}</strong>?
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setDeleteConfirmModalVisible(false)}>
            Cancel
          </CButton>
          <CButton color="danger" onClick={handleDeleteUser} disabled={loading}>
            {loading ? (
              <>
                <CSpinner size="sm" /> Delete
              </>
            ) : (
              'Delete'
            )}
          </CButton>
        </CModalFooter>
      </CModal>

      <CustomToast toast={toast} setToast={setToast} />
    </CCard>
  )
}

export default CreateAccount
