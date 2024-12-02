import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CRow,
  CCol,
  CContainer,
  CButtonGroup,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CListGroup,
  CListGroupItem,
} from '@coreui/react'
import { cilCheckCircle, cilXCircle, cilCloudDownload } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore'
import { db, auth } from 'src/backend/firebase'
import CustomToast from 'src/components/Toast/CustomToast'

const GroupRequest = () => {
  const [groupRequests, setGroupRequests] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [confirmModal, setConfirmModal] = useState(false)
  const [modalAction, setModalAction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const fetchAdviserRequests = async () => {
      try {
        const currentUser = auth.currentUser
        if (!currentUser) {
          console.log('No current user found')
          return
        }

        const requestsRef = collection(db, 'adviserRequests')
        const requestQuery = query(
          requestsRef,
          where('adviserUID', '==', currentUser.uid),
          where('status', '==', 'pending'),
        )
        const requestSnapshot = await getDocs(requestQuery)

        const requests = requestSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate(),
        }))

        setGroupRequests(requests)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching adviser requests:', error)
        setLoading(false)
      }
    }

    fetchAdviserRequests()
  }, [])

  const handleGroupSelect = (group) => {
    setSelectedGroup(group)
  }

  const openConfirmModal = (action) => {
    setModalAction(action)
    setConfirmModal(true)
  }

  const handleGroupRequestResponse = async (accepted) => {
    if (!selectedGroup) return

    try {
      const requestRef = doc(db, 'adviserRequests', selectedGroup.id)
      await updateDoc(requestRef, {
        status: accepted ? 'accepted' : 'rejected',
        responseTimestamp: new Date(),
      })

      if (accepted) {
        const proposalsRef = collection(db, 'proposals')
        const proposalQuery = query(
          proposalsRef,
          where('groupID', '==', selectedGroup.groupID),
          where('status', '==', 'accepted'),
        )
        const proposalSnapshot = await getDocs(proposalQuery)

        if (!proposalSnapshot.empty) {
          const proposalDoc = proposalSnapshot.docs[0]
          await updateDoc(doc(db, 'proposals', proposalDoc.id), {
            adviser: auth.currentUser.displayName,
            adviserUID: auth.currentUser.uid,
            lastUpdated: new Date(),
          })
        }
      }

      setGroupRequests((prev) => prev.filter((request) => request.id !== selectedGroup.id))
      setToast({
        color: 'success',
        message: `Group request ${accepted ? 'accepted' : 'rejected'} successfully!`,
      })
      setSelectedGroup(null)
      setConfirmModal(false)
    } catch (error) {
      console.error('Error handling adviser request:', error)
      setToast({
        color: 'danger',
        message: 'Failed to process request. Please try again.',
      })
    }
  }

  const downloadAbstract = async () => {
    if (!selectedGroup) return

    try {
      const proposalsRef = collection(db, 'proposals')
      const proposalQuery = query(
        proposalsRef,
        where('groupID', '==', selectedGroup.groupID),
        where('status', '==', 'accepted'),
      )
      const proposalSnapshot = await getDocs(proposalQuery)

      if (!proposalSnapshot.empty) {
        const proposalDoc = proposalSnapshot.docs[0]
        const abstractFormUrl = proposalDoc.data().abstractForm

        if (abstractFormUrl) {
          const link = document.createElement('a')
          link.href = abstractFormUrl
          link.download = `${selectedGroup.groupID}_abstract.pdf` // Customize file name
          link.click()
        } else {
          setToast({
            color: 'warning',
            message: 'No abstract file available for download.',
          })
        }
      } else {
        setToast({
          color: 'warning',
          message: 'No proposal found for this group.',
        })
      }
    } catch (error) {
      console.error('Error downloading abstract form:', error)
      setToast({
        color: 'danger',
        message: 'Failed to download abstract. Please try again.',
      })
    }
  }

  if (loading) {
    return <div>Loading requests...</div>
  }

  return (
    <CContainer fluid className="d-flex" style={{ fontSize: '0.875rem' }}>
      <CCard style={{ width: '250px', marginRight: '15px' }}>
        <CCardHeader className="py-2">
          <h6 className="m-0">Pending Group Requests</h6>
        </CCardHeader>
        <CCardBody className="p-0">
          <CListGroup>
            {groupRequests.length > 0 ? (
              groupRequests.map((request) => (
                <CListGroupItem
                  key={request.id}
                  onClick={() => handleGroupSelect(request)}
                  active={selectedGroup?.id === request.id}
                  color={selectedGroup?.id === request.id ? 'primary' : undefined}
                  className="py-2"
                >
                  <small>{request.groupID}</small>
                </CListGroupItem>
              ))
            ) : (
              <CListGroupItem className="py-2">
                <small>No pending requests</small>
              </CListGroupItem>
            )}
          </CListGroup>
        </CCardBody>
      </CCard>

      <CCard style={{ flex: 1 }}>
        <CCardHeader className="py-2">
          <h6 className="m-0">
            {selectedGroup ? `Group Request: ${selectedGroup.groupID}` : 'Select a Group Request'}
          </h6>
        </CCardHeader>
        <CCardBody>
          {selectedGroup ? (
            <div>
              <CCard className="mb-3">
                <CCardHeader className="py-2">
                  <small className="m-0 fw-bold">Group Members</small>
                </CCardHeader>
                <CCardBody className="p-2">
                  <CListGroup>
                    {selectedGroup.members?.map((member) => (
                      <CListGroupItem key={member.uid} className="py-1">
                        <small>
                          {member.name} - <em>{member.email}</em>
                        </small>
                      </CListGroupItem>
                    ))}
                  </CListGroup>
                </CCardBody>
              </CCard>

              <CCard className="mb-3">
                <CCardHeader className="py-2">
                  <small className="m-0 fw-bold">Approved Topic</small>
                </CCardHeader>
                <CCardBody className="p-2">
                  <h6 className="mb-2">{selectedGroup.approvedProposal?.title}</h6>
                  <p className="mb-2" style={{ fontSize: '0.8rem' }}>
                    {selectedGroup.approvedProposal?.description}
                  </p>
                  <CRow>
                    <CCol>
                      <small>
                        <strong>Client:</strong> {selectedGroup.approvedProposal?.client}
                      </small>
                    </CCol>
                    <CCol>
                      <small>
                        <strong>Field:</strong> {selectedGroup.approvedProposal?.field}
                      </small>
                    </CCol>
                  </CRow>
                  <CButton
                    style={{ backgroundColor: '#3634a3', color: 'white' }} 
                    size="sm"
                    className="mt-3"
                    onClick={downloadAbstract}
                  >
                    <CIcon icon={cilCloudDownload} className="me-1" />
                    Download Abstract
                  </CButton>
                </CCardBody>
              </CCard>

              <CButtonGroup className="w-100">
                <CButton color="success" size="sm" onClick={() => openConfirmModal('accept')}>
                  <CIcon icon={cilCheckCircle} className="me-1" />
                  Accept
                </CButton>
                <CButton color="danger" size="sm" onClick={() => openConfirmModal('reject')}>
                  <CIcon icon={cilXCircle} className="me-1" />
                  Reject
                </CButton>
              </CButtonGroup>
            </div>
          ) : (
            <div className="text-center text-muted">
              <p>Select a group request to view details</p>
            </div>
          )}
        </CCardBody>
      </CCard>

      <CModal visible={confirmModal} onClose={() => setConfirmModal(false)} size="sm">
        <CModalHeader>
          <CModalTitle>
            <small>
              {modalAction === 'accept' ? 'Accept Group Request' : 'Reject Group Request'}
            </small>
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <small>
            Are you sure you want to {modalAction} the group request for {selectedGroup?.groupID}?
          </small>
        </CModalBody>
        <CModalFooter>
          <CButton size="sm" color="secondary" onClick={() => setConfirmModal(false)}>
            Cancel
          </CButton>
          <CButton
            size="sm"
            color={modalAction === 'accept' ? 'success' : 'danger'}
            onClick={() => handleGroupRequestResponse(modalAction === 'accept')}
          >
            {modalAction === 'accept' ? 'Accept' : 'Reject'}
          </CButton>
        </CModalFooter>
      </CModal>

      <CustomToast toast={toast} setToast={setToast} />
    </CContainer>
  )
}

export default GroupRequest
