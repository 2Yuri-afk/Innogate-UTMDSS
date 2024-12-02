import React from 'react'
import { Navigate } from 'react-router-dom'
import { AppContent, AppSidebar, AppFooter, AppHeader } from '../components/index'
import { auth } from 'src/backend/firebase'
import { useRole } from 'src/RoleContext'

const DefaultLayout = () => {
  const user = auth.currentUser
  const role = useRole()

  if (!user) {
    return <Navigate to="/login" />
  }

  return (
    <div>
      <AppSidebar role={role} />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader />
        <div className="body flex-grow-1">
          <AppContent role={role} />
        </div>
      </div>
    </div>
  )
}

export default DefaultLayout
