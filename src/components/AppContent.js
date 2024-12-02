import React, { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { CContainer, CSpinner } from '@coreui/react'

// routes config
import routes from '../routes'

const AppContent = ({ role }) => {
  // Safely filter routes based on user role
  const filteredRoutes = routes.filter(
    (route) => Array.isArray(route.allowedRoles) && role && route.allowedRoles.includes(role),
  )

  return (
    <CContainer className="px-4" lg>
      <Suspense fallback={<CSpinner color="primary" />}>
        <Routes>
          {filteredRoutes.map(
            (route, idx) =>
              route.element && (
                <Route
                  key={idx}
                  path={route.path}
                  exact={route.exact}
                  name={route.name}
                  element={<route.element />}
                />
              ),
          )}

          <Route path="/" element={<Navigate to={`/schedule${role}`} replace />} />
        </Routes>
      </Suspense>
    </CContainer>
  )
}

export default React.memo(AppContent)
