import React, { useState } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilEnvelopeClosed } from '@coreui/icons'
import { auth } from '../../../backend/firebase'
import { sendPasswordResetEmail } from 'firebase/auth'
import { Link } from 'react-router-dom'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      await sendPasswordResetEmail(auth, email)
      setSuccess('Password reset email sent! Please check your inbox.')
      setEmail('') // Clear the email field after successful submission
    } catch (error) {
      console.error('Error sending reset email:', error.message)
      switch (error.code) {
        case 'auth/invalid-email':
          setError('The email address is not valid.')
          break
        case 'auth/user-not-found':
          setError('No user found with this email.')
          break
        case 'auth/too-many-requests':
          setError('Too many requests. Please try again later.')
          break
        default:
          setError('An error occurred. Please try again.')
          break
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center justify-content-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={6}>
            <CCard className="p-4">
              <CCardBody className="text-center">
                <CForm onSubmit={handleResetPassword}>
                  <h1>Reset Password</h1>
                  <p className="text-body-secondary">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                  {error && <div className="alert alert-danger">{error}</div>}
                  {success && <div className="alert alert-success">{success}</div>}
                  <CInputGroup className="mb-4">
                    <CInputGroupText>
                      <CIcon icon={cilEnvelopeClosed} />
                    </CInputGroupText>
                    <CFormInput
                      type="email"
                      placeholder="Email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </CInputGroup>
                  <CRow className="mb-3">
                    <CCol className="d-flex justify-content-center">
                      <CButton color="primary" className="px-4" type="submit" disabled={loading}>
                        {loading ? (
                          <>
                            <CSpinner size="sm" className="me-2" />
                            Sending...
                          </>
                        ) : (
                          'Send Reset Link'
                        )}
                      </CButton>
                    </CCol>
                  </CRow>
                  <CRow>
                    <CCol className="d-flex justify-content-center">
                      <Link to="/login" className="text-decoration-none">
                        <CButton color="link" className="px-0">
                          Back to Login
                        </CButton>
                      </Link>
                    </CCol>
                  </CRow>
                </CForm>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default ForgotPassword
