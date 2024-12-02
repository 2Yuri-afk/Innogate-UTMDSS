import React from 'react'
import { CCol, CContainer, CRow, CButton } from '@coreui/react'
import { useNavigate } from 'react-router-dom'

const ErrorPage = () => {
  const navigate = useNavigate()

  const handleGoBack = () => {
    navigate(-1)
  }

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-column justify-content-center align-items-center">
      <CContainer className="text-center">
        <CRow className="justify-content-center">
          <CCol md={6}>
            <div className="text-center">
              <h1 className="display-3 fw-bold text-danger">ERROR</h1>
              <h4 className="pt-3">Oops! You{"'"}re lost.</h4>
              <p className="text-muted">
                You sneaky little human ;)
                <br />
                The page you are looking for does not exist.
              </p>
              <CButton onClick={handleGoBack} color="primary" className="mt-4">
                Go Back
              </CButton>
            </div>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default ErrorPage
