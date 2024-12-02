import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CSpinner, // Import CoreUI Spinner
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser } from '@coreui/icons'
import { auth, db } from 'src/backend/firebase' // Adjust the import path as needed
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false) // State to track loading status
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is already logged in
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in, you can fetch user role and navigate
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          const role = userData.role
          console.log(role)
          navigate('/')
        } else {
          setError('User data not found.')
        }
      }
    })

    return () => unsubscribe() // Clean up subscription on unmount
  }, [navigate])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true) // Start loading spinner

    try {
      // Sign in the user
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Fetch the user role from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        const role = userData.role

        navigate('/')
      } else {
        setError('User data not found.')
      }
    } catch (error) {
      console.error('Error logging in:', error.message)
      switch (error.code) {
        case 'auth/invalid-email':
          setError('The email address is not valid.')
          break
        case 'auth/user-not-found':
          setError('No user found with this email.')
          break
        case 'auth/wrong-password':
          setError('The password is incorrect.')
          break
        case 'auth/invalid-credential':
          setError('The credentials provided are not valid. Please try again.')
          break
        default:
          setError('An error occurred. Please try again.')
          break
      }
    } finally {
      setLoading(false) // Stop loading spinner
    }
  }

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center justify-content-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={8}>
            <CCardGroup>
              <CCard className="p-4">
                <CCardBody className="text-center">
                  <CForm onSubmit={handleLogin}>
                    <h1>Login</h1>
                    <p className="text-body-secondary">Sign In to your account</p>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilUser} />
                      </CInputGroupText>
                      <CFormInput
                        type="email"
                        placeholder="Email"
                        autoComplete="username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </CInputGroup>
                    <CInputGroup className="mb-4">
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        type="password"
                        placeholder="Password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </CInputGroup>
                    <CRow className="mb-3">
                      <CCol className="d-flex justify-content-center">
                        <CButton color="primary" className="px-4" type="submit" disabled={loading}>
                          {loading ? (
                            <>
                              <CSpinner size="sm" /> Login
                            </>
                          ) : (
                            'Login'
                          )}
                        </CButton>
                      </CCol>
                    </CRow>
                    <CRow>
                      <CCol className="d-flex justify-content-center">
                        <Link to="/forgot-password" className="text-decoration-none">
                          <CButton color="link" className="px-0">
                            Forgot password?
                          </CButton>
                        </Link>
                      </CCol>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Login
