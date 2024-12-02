import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  CSidebar,
  CSidebarBrand,
  CSidebarHeader,
  CSidebarFooter,
  CSidebarToggler,
  CAvatar,
  CCard,
  CCardBody,
  CCollapse,
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { AppSidebarNav } from './AppSidebarNav'
import { logo } from 'src/assets/brand/logo'
import { sygnet } from 'src/assets/brand/sygnet'
import { cilAccountLogout, cilChevronRight, cilChevronBottom } from '@coreui/icons'
import { auth, db } from 'src/backend/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import _nav from '../_nav'

const defaultProfilePic = 'src/assets/images/avatars/pic.png'

const AppSidebar = () => {
  const dispatch = useDispatch()
  const unfoldable = useSelector((state) => state.sidebarUnfoldable)
  const sidebarShow = useSelector((state) => state.sidebarShow)
  const [photoURL, setPhotoURL] = useState(defaultProfilePic)
  const [name, setName] = useState('User')
  const [email, setEmail] = useState('user@mail.com')
  const [hovered, setHovered] = useState(false)
  const [collapse, setCollapse] = useState(false) // State to manage collapse
  const [logoutConfirmModalVisible, setLogoutConfirmModalVisible] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchUserProfile = async () => {
      const currentUser = auth.currentUser
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setPhotoURL(userData.photoURL || defaultProfilePic)
          setName(userData.name || 'User')
          setEmail(userData.email || 'user@mail.com')
        }
      }
    }

    fetchUserProfile()
  }, [])

  const handleLogoutConfirmation = () => {
    setLogoutConfirmModalVisible(true)
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error.message)
    }
  }

  const handleMouseEnter = () => {
    if (unfoldable) {
      setHovered(true)
    }
  }

  const handleMouseLeave = () => {
    if (unfoldable) {
      setHovered(false)
    }
  }

  const toggleCollapse = () => {
    setCollapse(!collapse)
  }

  return (
    <CSidebar
      className="border-end"
      colorScheme="dark"
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible) => {
        dispatch({ type: 'set', sidebarShow: visible })
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <CSidebarHeader className="border-bottom">
      <CSidebarBrand
        to="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          height: '2rem', // Adjust height based on your design
          width: '100%', // Ensures it takes the full width of the sidebar
        }}
      >
        <img
          src="src/assets/brand/logoIT.png"
          alt="Logo"
          style={{ width: '170px', maxWidth: '100%' }}
        />
      </CSidebarBrand>
      </CSidebarHeader>

      {/* Sidebar Navigation */}
      <AppSidebarNav items={_nav()} />

      {/* Profile Card with conditional rendering */}
      {!unfoldable || hovered ? (
        // Show the full profile card when sidebar is folded or hovered
        <CCard
          className="d-flex align-items-center position-relative"
          style={{
            backgroundColor: '#1c1f2b',
            borderRadius: '12px',
            padding: '0.75rem',
            margin: '10px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            transition: 'transform 0.2s ease, background-color 0.2s ease',
            cursor: 'pointer', // Makes the card clickable
          }}
          onClick={toggleCollapse} // Toggle collapse on card click
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2a2d3e')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1c1f2b')}
        >
          <CCardBody className="d-flex align-items-center p-0 w-100">
            <div style={{ flexShrink: 0 }}>
              <CAvatar
                src={photoURL}
                size="md"
                className="me-3"
                style={{
                  border: '1px solid gray',
                  width: '40px',
                  height: '40px',
                }}
              />
            </div>
            <div
              className="d-flex flex-column flex-grow-1"
              style={{
                overflow: 'hidden',
              }}
            >
              <h6
                style={{
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  color: '#FFF',
                  marginBottom: '0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '150px',
                }}
                title={name}
              >
                {name}
              </h6>
              <p
                style={{
                  fontSize: '0.6rem',
                  color: '#888',
                  marginBottom: '0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '150px',
                }}
                title={email}
              >
                {email}
              </p>
            </div>

            <CIcon
              icon={collapse ? cilChevronBottom : cilChevronRight}
              className="ms-2"
              style={{ color: '#888', cursor: 'pointer', width: '10px' }}
            />
          </CCardBody>

          <CCollapse visible={collapse}>
            <div className="d-flex justify-content-center mt-2 w-100">
              <CButton
                color="danger"
                size="sm"
                onClick={handleLogoutConfirmation}
                className="w-100"
                style={{
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                }}
              >
                <CIcon icon={cilAccountLogout} className="me-2" />
                Log out
              </CButton>
            </div>
          </CCollapse>
        </CCard>
      ) : (
        <div className="d-flex justify-content-center py-2">
          <CAvatar
            src={photoURL}
            size="md"
            style={{
              border: '2px solid gray',
              padding: '3px',
            }}
          />
        </div>
      )}

      <CSidebarFooter className="border-top d-none d-lg-flex">
        <CSidebarToggler
          onClick={() => dispatch({ type: 'set', sidebarUnfoldable: !unfoldable })}
        />
      </CSidebarFooter>

      {/* Logout Confirmation Modal */}
      <CModal
        visible={logoutConfirmModalVisible}
        onClose={() => setLogoutConfirmModalVisible(false)}
      >
        <CModalHeader>
          <CModalTitle>Confirm Logout</CModalTitle>
        </CModalHeader>
        <CModalBody>Are you sure you want to logout?</CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setLogoutConfirmModalVisible(false)}>
            Cancel
          </CButton>
          <CButton color="danger" onClick={handleLogout}>
            Logout
          </CButton>
        </CModalFooter>
      </CModal>
    </CSidebar>
  )
}

export default React.memo(AppSidebar)
