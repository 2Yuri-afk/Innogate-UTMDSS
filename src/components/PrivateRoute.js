import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { auth } from 'src/backend/firebase'
import { useRole } from 'src/RoleContext'

const roleBasedRoutes = {
  '/scheduleAdviser': ['Adviser', 'Admin'],
  '/groupRequest': ['Adviser'],
  '/viewManuscript': ['Adviser'],
  '/editProfileAdviser': ['Adviser'],

  '/scheduleTeacher': ['Teacher', 'Admin'],
  '/myStudents': ['Teacher'],
  '/proposalManagement': ['Teacher'],
  '/editProfileTeacher': ['Teacher'],

  '/scheduleStudent': ['Student', 'Admin'],
  '/thesisProposal': ['Student'],
  '/uploadManuscript': ['Student'],
  '/groupDetails': ['Student'],
  '/editProfileStudent': ['Student'],

  '/scheduleAdmin': ['Admin'],
  '/createAccount': ['Admin'],
  '/editProfileAdmin': ['Admin'],
}

const PrivateRoute = ({ children, roles }) => {
  const user = auth.currentUser
  const role = useRole()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const currentPath = location.pathname

  if (roleBasedRoutes[currentPath] && !roleBasedRoutes[currentPath].includes(role)) {
    return <Navigate to="/ErrorPage" replace />
  }

  return children
}

export default PrivateRoute
