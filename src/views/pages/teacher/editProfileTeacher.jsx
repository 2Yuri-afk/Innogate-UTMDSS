import React, { useEffect, useState } from 'react'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CButton,
  CForm,
  CFormInput,
  CImage,
  CFormLabel,
  CRow,
  CCol,
  CSpinner,
} from '@coreui/react'
import { updateDoc, doc, getDoc } from 'firebase/firestore'
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import { db, auth, storage } from 'src/backend/firebase'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import CustomToast from 'src/components/Toast/CustomToast'

const defaultProfilePic = 'src/assets/images/avatars/pic.png'

const EditProfile = () => {
  const [photoURL, setPhotoURL] = useState(defaultProfilePic)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [photoLoading, setPhotoLoading] = useState(false)

  const [previewURL, setPreviewURL] = useState('')
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser
      if (currentUser) {
        // Fetch user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setName(userData.name)
          setEmail(currentUser.email) // Email is fetched from auth
          setPhotoURL(userData.photoURL || defaultProfilePic) // Use Firestore photoURL or default
        }
      }
    }

    fetchUserData()
  }, [])

  // Function to handle profile picture change and upload to Firebase Storage
  const handlePhotoChange = (e) => {
    const newPhoto = e.target.files[0]
    if (newPhoto) {
      setPreviewURL(URL.createObjectURL(newPhoto)) // Preview the selected image
      setIsPreviewing(true)
    }
  }

  const cancelPhotoChange = () => {
    setIsPreviewing(false)
    setPreviewURL('')
    document.getElementById('formFile').value = '' // Reset file input
  }

  const confirmPhotoChange = async () => {
    if (!previewURL) {
      setToast({
        color: 'danger',
        message: 'Please select a valid image before confirming.',
      })
      return
    }

    const newPhoto = document.getElementById('formFile').files[0] // Directly get the file from the input
    if (!newPhoto) {
      setToast({
        color: 'danger',
        message: 'No photo selected.',
      })
      return
    }

    const storageRef = ref(
      storage,
      `profile_pictures/${auth.currentUser.uid}/${new Date().getTime()}_profile.jpg`,
    )

    const uploadTask = uploadBytesResumable(storageRef, newPhoto) // Pass the file directly

    setPhotoLoading(true)

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        // Optional: You can add progress feedback here
      },
      (error) => {
        console.error('Error uploading file:', error)
        setToast({
          color: 'danger',
          message: 'Failed to upload profile picture.',
        })
        setPhotoLoading(false)
      },
      async () => {
        // Get the download URL and update Firestore with the new profile picture
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
        await updateDoc(doc(db, 'users', auth.currentUser.uid), { photoURL: downloadURL })

        // Update the state to display the new photo URL
        setPhotoURL(downloadURL)
        setPhotoLoading(false)
        setToast({
          color: 'success',
          message: 'Profile picture updated successfully!',
        })
        setIsPreviewing(false)
        setPreviewURL('')
      },
    )
  }

  // Function to update the user's password
  const handlePasswordChange = async () => {
    setLoading(true)

    try {
      const currentUser = auth.currentUser
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword)

      // Re-authenticate user
      await reauthenticateWithCredential(currentUser, credential)

      // Check if new passwords match
      if (newPassword !== confirmPassword) {
        setToast({
          color: 'danger',
          message: 'New passwords do not match.',
        })
        return
      }

      await updatePassword(currentUser, newPassword)
      setToast({
        color: 'success',
        message: 'Password updated successfully!',
      })
      setNewPassword('')
      setCurrentPassword('')
      setConfirmPassword('')
    } catch (error) {
      setToast({
        color: 'danger',
        message: 'Failed to update password.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <CRow>
      <CCol md={6} className="mb-3">
        <CCard style={{ minHeight: '253px', width: '100%' }}>
          <CCardHeader className="text-center">
            <h5>Change Profile Picture</h5>
          </CCardHeader>
          <CCardBody className="d-flex flex-column align-items-center">
            <CRow className="w-100">
              <CCol xs={12} md={5} className="d-flex justify-content-center mb-3 mb-md-0">
                <CImage
                  src={isPreviewing ? previewURL : photoURL}
                  width={150}
                  height={150}
                  alt="Profile Picture"
                  style={{
                    border: '3px solid gray',
                    borderRadius: '10px',
                    boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
                  }}
                />
              </CCol>
              <CCol xs={12} md={7} className="d-flex flex-column align-items-start">
                <CFormInput
                  type="file"
                  id="formFile"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="mb-3"
                />
                {isPreviewing && (
                  <>
                    <CButton
                      color="primary"
                      onClick={confirmPhotoChange}
                      className="mb-3 w-100"
                      disabled={photoLoading}
                    >
                      {photoLoading ? (
                        <>
                          <CSpinner size="sm" /> Confirm
                        </>
                      ) : (
                        'Confirm'
                      )}
                    </CButton>
                    <CButton color="secondary" onClick={cancelPhotoChange} className="w-100">
                      Cancel
                    </CButton>
                  </>
                )}
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol md={6} className="mb-3">
        <CCard style={{ minHeight: '250px', width: '100%' }}>
          <CCardHeader>
            <h5>Name and Email</h5>
          </CCardHeader>
          <CCardBody>
            <div className="mb-3">
              <CFormLabel>Name</CFormLabel>
              <CFormInput type="text" value={name} readOnly />
            </div>
            <div className="mb-3">
              <CFormLabel>Email</CFormLabel>
              <CFormInput type="email" value={email} readOnly />
            </div>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol md={12}>
        <CCard className="mb-3">
          <CCardHeader>
            <h5>Change Password</h5>
          </CCardHeader>
          <CCardBody>
            <CForm>
              <div className="mb-3">
                <CFormLabel>Current Password</CFormLabel>
                <CFormInput
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <CFormLabel>New Password</CFormLabel>
                <CFormInput
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <CFormLabel>Confirm New Password</CFormLabel>
                <CFormInput
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <CButton color="primary" onClick={handlePasswordChange} disabled={loading}>
                {loading ? (
                  <>
                    <CSpinner size="sm" /> Update Password
                  </>
                ) : (
                  'Update Password'
                )}
              </CButton>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
      <CustomToast toast={toast} setToast={setToast} /> {/* Added CustomToast */}
    </CRow>
  )
}

export default EditProfile
