import React, { Suspense, useEffect, useState } from 'react'
import { HashRouter, Route, Routes, Navigate } from 'react-router-dom'
import { CSpinner, useColorModes } from '@coreui/react'
import { useSelector } from 'react-redux'
import { auth } from './backend/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import './scss/style.scss'
import { RoleProvider } from './RoleContext'

// Containers
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))

// Pages
const Login = React.lazy(() => import('./views/pages/auth/Login'))
const ForgotPassword = React.lazy(() => import('./views/pages/auth/ForgotPassword'))
const ErrorPage = React.lazy(() => import('./views/pages/errorPage/ErrorPage'))

// Private Route Component
import PrivateRoute from './components/PrivateRoute'

const App = () => {
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const storedTheme = useSelector((state) => state.theme)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // Add loading state

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.href.split('?')[1])
    const theme = urlParams.get('theme') && urlParams.get('theme').match(/^[A-Za-z0-9\s]+/)[0]
    if (theme) {
      setColorMode(theme)
    }

    if (isColorModeSet()) {
      return
    }

    setColorMode(storedTheme)
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="pt-3 text-center">
        <CSpinner color="primary" variant="grow" />
      </div>
    )
  }

  return (
    <RoleProvider>
      <HashRouter>
        <Suspense
          fallback={
            <div className="pt-3 text-center">
              <CSpinner color="primary" variant="grow" />
            </div>
          }
        >
          <Routes>
            {/* Public Routes */}
            <Route exact path="/login" name="Login Page" element={<Login />} />
            <Route
              exact
              path="/forgot-password"
              name="Forgot Password"
              element={<ForgotPassword />}
            />

            <Route exact path="/ErrorPage" name="Error Page" element={<ErrorPage />} />

            {/* Private Routes */}

            <Route
              path="*"
              name="Home"
              element={
                user ? (
                  <PrivateRoute roles={['Admin', 'Teacher', 'Adviser', 'Student']}>
                    <DefaultLayout />
                  </PrivateRoute>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
        </Suspense>
      </HashRouter>
    </RoleProvider>
  )
}

export default App
