import React, { useState, useEffect, useRef } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CListGroup,
  CListGroupItem,
  CFormTextarea,
  CButton,
  CPagination,
  CPaginationItem,
  CSpinner,
} from '@coreui/react'
import { Maximize, Minimize, Save } from 'lucide-react'
import { db, auth } from 'src/backend/firebase'
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  getDoc,
} from 'firebase/firestore'
import CustomToast from 'src/components/Toast/CustomToast'

const ViewManuscript = () => {
  const [groups, setGroups] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [currentGroup, setCurrentGroup] = useState(null)
  const [groupMembers, setGroupMembers] = useState([])
  const [feedback, setFeedback] = useState('')
  const [studentNotes, setStudentNotes] = useState('')
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const previewRef = useRef(null)
  const itemsPerPage = 1 // One group per page

  // Fetch adviser's assigned groups on component mount
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const currentUser = auth.currentUser
        if (!currentUser) {
          setToast({
            color: 'danger',
            message: 'Please sign in to view manuscripts.',
          })
          return
        }

        const adviserDoc = await getDoc(doc(db, 'users', currentUser.uid))
        if (!adviserDoc.exists()) {
          setToast({
            color: 'danger',
            message: 'Adviser profile not found.',
          })
          return
        }

        const adviserName = adviserDoc.data().name

        // Query adviserRequests where adviserName matches and status is accepted
        const adviserRequestsQuery = query(
          collection(db, 'adviserRequests'),
          where('adviserName', '==', adviserName),
          where('status', '==', 'accepted')
        )
        const adviserRequestsSnapshot = await getDocs(adviserRequestsQuery)

        const groupIDs = []
        adviserRequestsSnapshot.forEach((doc) => {
          const requestData = doc.data()
          if (requestData.groupID) {
            groupIDs.push(requestData.groupID)
          }
        })

        if (groupIDs.length === 0) {
          setToast({
            color: 'warning',
            message: 'No groups found for the adviser.',
          })
          setGroups([])
          return
        }

        // Query groups that match the groupIDs
        const groupsQuery = query(
          collection(db, 'users'),
          where('groupID', 'in', groupIDs)
        )
        const groupsSnapshot = await getDocs(groupsQuery)

        // Group users by groupID
        const groupedData = {}
        groupsSnapshot.forEach((doc) => {
          const userData = doc.data()
          if (!groupedData[userData.groupID]) {
            groupedData[userData.groupID] = []
          }
          groupedData[userData.groupID].push({
            id: doc.id,
            ...userData,
          })
        })

        setGroups(Object.entries(groupedData))
        if (Object.entries(groupedData).length > 0) {
          handleGroupChange(Object.entries(groupedData)[0])
        }
      } catch (error) {
        console.error('Error fetching groups:', error)
        setToast({
          color: 'danger',
          message: `Error fetching groups: ${error.message}`,
        })
      }
    }

    fetchGroups()
  }, [])

  const handleGroupChange = (group) => {
    setCurrentGroup(group)
    setGroupMembers(group[1])
    // Get existing feedback if any
    const existingFeedback = group[1][0]?.feedback || ''
    const existingStudentNotes = group[1][0]?.notes || ''
    setFeedback(existingFeedback)
    setStudentNotes(existingStudentNotes)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    handleGroupChange(groups[page - 1])
  }

  const handleFeedbackSubmit = async () => {
    if (!currentGroup) return

    setLoading(true)
    try {
      // Update feedback for all group members
      const updatePromises = groupMembers.map((member) =>
        updateDoc(doc(db, 'users', member.id), {
          feedback: feedback,
          feedbackDate: new Date().toISOString(),
        }),
      )

      await Promise.all(updatePromises)

      setToast({
        color: 'success',
        message: 'Feedback submitted successfully!',
      })
    } catch (error) {
      console.error('Error submitting feedback:', error)
      setToast({
        color: 'danger',
        message: `Error submitting feedback: ${error.message}`,
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      previewRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`)
      })
    } else {
      document.exitFullscreen()
    }
  }

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullScreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange)
  }, [])

  return (
    <div>
      <CRow>
        <CCol md={4}>
          <CCard className="mb-4">
            <CCardHeader>Group Members</CCardHeader>
            <CCardBody>
              <CListGroup>
                {groupMembers.map((member, index) => (
                  <CListGroupItem key={member.id}>
                    <div className="ms-2 me-auto">
                      <div className="fw-bold">{member.name || `Student ${index + 1}`}</div>
                      {member.email}
                    </div>
                  </CListGroupItem>
                ))}
              </CListGroup>
            </CCardBody>
          </CCard>

          <CCard className="mb-4">
            <CCardHeader>Feedback</CCardHeader>
            <CCardBody>
              <CFormTextarea
                rows={6}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Enter your feedback here..."
              />
              <CButton
                color="primary"
                className="mt-3"
                onClick={handleFeedbackSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <CSpinner size="sm" className="me-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={20} className="me-2" />
                    Save Feedback
                  </>
                )}
              </CButton>
            </CCardBody>
          </CCard>

          <CCard>
            <CCardHeader>Student's Notes</CCardHeader>
            <CCardBody>
              <CFormTextarea
                rows={6}
                value={studentNotes}
                readOnly
                placeholder="No notes available"
              />
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={8}>
          <CCard className="mb-4">
            <CCardHeader>Manuscript Preview</CCardHeader>
            <CCardBody>
              {currentGroup && currentGroup[1][0]?.fileContainer?.file ? (
                <div className="position-relative">
                  <iframe
                    ref={previewRef}
                    src={currentGroup[1][0].fileContainer.file}
                    title="PDF Preview"
                    width="100%"
                    height="600px"
                    className="mb-3"
                  />
                  <CButton
                    color="secondary"
                    size="sm"
                    className="position-absolute top-0 end-0 m-2"
                    onClick={toggleFullScreen}
                  >
                    {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
                  </CButton>
                </div>
              ) : (
                <div className="text-center py-5">
                  <p>No manuscript uploaded yet</p>
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CPagination className="justify-content-center" aria-label="Group navigation">
        {groups.map((_, index) => (
          <CPaginationItem
            key={index}
            active={currentPage === index + 1}
            onClick={() => handlePageChange(index + 1)}
          >
            {index + 1}
          </CPaginationItem>
        ))}
      </CPagination>

      <CustomToast toast={toast} setToast={setToast} />
    </div>
  )
}

export default ViewManuscript