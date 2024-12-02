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
  CFormTextarea,
  CSpinner,
  CBadge,
  CAvatar,
} from '@coreui/react'
import { 
  cilCheckCircle, 
  cilXCircle, 
  cilSync, 
  cilCloudDownload 
} from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { db, auth, storage } from 'src/backend/firebase'
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore'
import { ref, getDownloadURL } from 'firebase/storage'
import { fetchMembersByGroup } from 'src/components/Calendar/firestoreUtils.js'
import CustomToast from 'src/components/Toast/CustomToast'

const ProposalManagement = () => {
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [proposalsByGroup, setProposalsByGroup] = useState({})
  const [groupMembers, setGroupMembers] = useState([])
  const [toast, setToast] = useState(null)
  const [revisionModal, setRevisionModal] = useState(false)
  const [revisionComment, setRevisionComment] = useState('')
  const [selectedProposal, setSelectedProposal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [teacherID, setTeacherID] = useState(null)
  const [teacherGroups, setTeacherGroups] = useState([])
  const [downloadLoading, setDownloadLoading] = useState({})

  // First, fetch teacher data and their enrolled students' groups
  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const currentUser = auth.currentUser
        if (currentUser) {
          const usersSnapshot = await getDocs(collection(db, 'users'))
          const teacher = usersSnapshot.docs
            .map((doc) => ({ ...doc.data(), id: doc.id }))
            .find((user) => user.uid === currentUser.uid && user.role === 'Teacher')

          if (teacher) {
            setTeacherID(teacher.teacherID)

            // Get all students for this teacher
            const students = usersSnapshot.docs
              .map((doc) => ({ ...doc.data(), id: doc.id }))
              .filter((user) => user.role === 'Student' && user.myTeacher === teacher.teacherID)

            // Extract unique group IDs
            const groups = [...new Set(students.map((student) => student.groupID))].filter(Boolean)

            setTeacherGroups(groups)

            // Fetch proposals for these groups
            if (groups.length > 0) {
              const proposalsSnapshot = await getDocs(collection(db, 'proposals'))
              const fetchedProposals = proposalsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }))

              const groupedProposals = groups.reduce((acc, groupID) => {
                acc[groupID] = fetchedProposals.filter((proposal) => proposal.groupID === groupID)
                return acc
              }, {})

              setProposalsByGroup(groupedProposals)
              setSelectedGroup(groups[0])
              setLoading(false)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching teacher data:', error)
        setToast({
          color: 'danger',
          message: 'Error fetching data',
        })
        setLoading(false)
      }
    }

    fetchTeacherData()
  }, [])

  // Existing useEffect for loading group members
  useEffect(() => {
    const loadGroupMembers = async () => {
      if (selectedGroup) {
        try {
          const members = await fetchMembersByGroup(selectedGroup)
          setGroupMembers(members)
        } catch (error) {
          console.error('Error fetching group members:', error)
          setToast({
            color: 'danger',
            message: 'Error fetching group members',
          })
        }
      }
    }

    loadGroupMembers()
  }, [selectedGroup])

  // New function to handle abstract form download
  const handleDownloadAbstract = async (proposalId, abstractFormUrl) => {
    // Start loading for this specific proposal
    setDownloadLoading(prev => ({...prev, [proposalId]: true}))

    try {
      // Fetch the download URL
      const downloadURL = await getDownloadURL(ref(storage, abstractFormUrl))
      
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a')
      link.href = downloadURL
      
      // Extract filename from URL or use a default
      const filename = abstractFormUrl.split('/').pop().split('?')[0] || 'abstract.pdf'
      link.download = filename
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setToast({
        color: 'success',
        message: 'Abstract form downloaded successfully',
      })
    } catch (error) {
      console.error('Error downloading abstract form:', error)
      setToast({
        color: 'danger',
        message: 'Failed to download abstract form',
      })
    } finally {
      // Stop loading for this proposal
      setDownloadLoading(prev => ({...prev, [proposalId]: false}))
    }
  }

  // Rest of the existing methods (handleGroupSelect, handleApprove, handleReject, etc.)
  const handleGroupSelect = (groupID) => {
    setSelectedGroup(groupID)
  }

  const handleApprove = async (proposalId) => {
    try {
      const approvedProposalRef = doc(db, 'proposals', proposalId)
      await updateDoc(approvedProposalRef, {
        status: 'accepted',
      })

      // Update other proposals in the same group to 'rejected'
      const otherProposalUpdates = proposalsByGroup[selectedGroup]
        .filter((proposal) => proposal.id !== proposalId)
        .map(async (proposal) => {
          const proposalRef = doc(db, 'proposals', proposal.id)
          await updateDoc(proposalRef, {
            status: 'rejected',
          })
        })

      await Promise.all(otherProposalUpdates)

      setProposalsByGroup((prevProposals) => ({
        ...prevProposals,
        [selectedGroup]: prevProposals[selectedGroup].map((proposal) => {
          if (proposal.id === proposalId) {
            return { ...proposal, status: 'accepted' }
          } else {
            return { ...proposal, status: 'rejected' }
          }
        }),
      }))

      setToast({
        color: 'success',
        message: 'Proposal Approved',
      })
    } catch (error) {
      setToast({
        color: 'danger',
        message: 'Failed to approve',
      })
    }
  }

  const handleReject = async (proposalId) => {
    try {
      const proposalRef = doc(db, 'proposals', proposalId)
      await updateDoc(proposalRef, {
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
      })

      setProposalsByGroup((prevProposals) => ({
        ...prevProposals,
        [selectedGroup]: prevProposals[selectedGroup].map((proposal) =>
          proposal.id === proposalId ? { ...proposal, status: 'rejected' } : proposal,
        ),
      }))

      setToast({
        color: 'success',
        message: 'Proposal Rejected',
      })
    } catch (error) {
      setToast({
        color: 'danger',
        message: 'Failed to reject',
      })
    }
  }

  const handleRevise = (proposal) => {
    setSelectedProposal(proposal)
    setRevisionComment('')
    setRevisionModal(true)
  }

  const handleRevisionSubmit = async () => {
    if (!revisionComment.trim()) {
      setToast({
        color: 'danger',
        message: 'Please add comments for revision',
      })
      return
    }

    setLoading(true)
    try {
      const proposalRef = doc(db, 'proposals', selectedProposal.id)
      await updateDoc(proposalRef, {
        status: 'needs_revision',
        teacherComment: revisionComment,
        lastUpdated: new Date().toISOString(),
      })

      setProposalsByGroup((prevProposals) => ({
        ...prevProposals,
        [selectedGroup]: prevProposals[selectedGroup].map((proposal) =>
          proposal.id === selectedProposal.id
            ? {
                ...proposal,
                status: 'needs_revision',
                teacherComment: revisionComment,
              }
            : proposal,
        ),
      }))

      setToast({
        color: 'success',
        message: 'Revision requested',
      })

      setRevisionModal(false)
    } catch (error) {
      setToast({
        color: 'danger',
        message: 'Error requesting revision',
      })
    } finally {
      setLoading(false)
    }
  }

  // Helper function to get badge color based on status
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'success'
      case 'rejected':
        return 'danger'
      case 'needs_revision':
        return 'warning'
      default:
        return 'secondary'
    }
  }

  // Helper function to disable buttons
  const isButtonDisabled = (proposal) => {
    // Disable buttons if proposal is accepted or rejected
    // Or if any other proposal in the group is accepted
    const hasAcceptedProposal = proposalsByGroup[selectedGroup].some((p) => p.status === 'accepted')

    return (
      proposal.status === 'accepted' ||
      proposal.status === 'rejected' ||
      (hasAcceptedProposal && proposal.status !== 'needs_revision')
    )
  }

  if (loading) {
    return <div>Loading proposals...</div>
  }

  return (
    <CContainer fluid className="d-flex" style={{ fontSize: '0.875rem' }}>
      {/* Left sidebar containing Groups and Members */}
      <div style={{ width: '250px', marginRight: '15px' }}>
        {/* Groups Card */}
        <CCard className="mb-3">
          <CCardHeader className="py-2">
            <h6 className="m-0">My Groups</h6>
          </CCardHeader>
          <CCardBody className="p-0">
            <CListGroup>
              {teacherGroups.length > 0 ? (
                teacherGroups.map((groupID) => (
                  <CListGroupItem
                    key={groupID}
                    onClick={() => handleGroupSelect(groupID)}
                    active={selectedGroup === groupID}
                    color={selectedGroup === groupID ? 'primary' : undefined}
                    className="py-2"
                  >
                    <small>{groupID}</small>
                  </CListGroupItem>
                ))
              ) : (
                <CListGroupItem className="py-2">
                  <small>No groups found</small>
                </CListGroupItem>
              )}
            </CListGroup>
          </CCardBody>
        </CCard>

        {/* Members Card */}
        <CCard>
          <CCardHeader className="py-2">
            <h6 className="m-0">Members</h6>
          </CCardHeader>
          <CCardBody className="p-0">
            <CListGroup>
              {selectedGroup ? (
                groupMembers.length > 0 ? (
                  groupMembers.map((member) => (
                    <CListGroupItem key={member.id} className="py-2">
                      <div className="d-flex align-items-center">
                        <CAvatar
                          src={member.photoURL || '/avatars/default.jpg'}
                          size="sm"
                          className="me-2"
                        />
                        <small>{member.name || member.email}</small>
                      </div>
                    </CListGroupItem>
                  ))
                ) : (
                  <CListGroupItem className="py-2">
                    <small>No members in this group</small>
                  </CListGroupItem>
                )
              ) : (
                <CListGroupItem className="py-2">
                  <small>Select a group to see members</small>
                </CListGroupItem>
              )}
            </CListGroup>
          </CCardBody>
        </CCard>
      </div>
      {/* Main Content - Proposal Details */}
      <CCard style={{ flex: 1 }}>
        <CCardHeader className="py-2">
          <h6 className="m-0">{selectedGroup ? `Group: ${selectedGroup}` : 'Select a Group'}</h6>
        </CCardHeader>
        <CCardBody>
          {selectedGroup && proposalsByGroup[selectedGroup]?.length > 0 ? (
            proposalsByGroup[selectedGroup].map((proposal) => (
              <CCard key={proposal.id} className="mb-3">
                <CCardHeader className="py-2">
                  <small className="m-0 fw-bold">{proposal.title}</small>
                </CCardHeader>
                <CCardBody className="p-2">
                  <p className="mb-2" style={{ fontSize: '0.8rem' }}>
                    {proposal.description}
                  </p>
                  <CRow>
                    <CCol>
                      <small>
                        <strong>Client:</strong> {proposal.client}
                      </small>
                    </CCol>
                    <CCol>
                      <small>
                        <strong>Field:</strong> {proposal.field}
                      </small>
                    </CCol>
                  </CRow>
                  <CRow className="mt-2">
                    <CCol>
                      <small>
                        <strong>Status:</strong>{' '}
                        <CBadge
                          color={getStatusBadgeColor(proposal.status)}
                          className="text-capitalize"
                        >
                          {proposal.status.replace('_', ' ')}
                        </CBadge>
                      </small>
                    </CCol>
                  </CRow>
                  {/* New Abstract Form Download Section */}
                  <CRow className="mt-2">
                    <CCol>
                    <div className="d-flex justify-content-end w-100">
                    <CButton
                      style={{ backgroundColor: '#3634a3', color: 'white' }}  // Set custom background and font color
                      size="sm"
                      onClick={() => handleDownloadAbstract(proposal.id, proposal.abstractForm)}
                      disabled={!proposal.abstractForm || downloadLoading[proposal.id]}
                      className="ms-auto"  // Align to the left (move to the other side)
                    >
                      {downloadLoading[proposal.id] ? (
                        <>
                          <CSpinner size="sm" className="me-1" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <CIcon icon={cilCloudDownload} className="me-1" />
                          Download Abstract
                        </>
                      )}
                    </CButton>
                    </div>
                    

                    </CCol>
                  </CRow>
                </CCardBody>
                <CCardBody className="border-top p-2">
                <CButtonGroup className="w-100">
                    <CButton
                      color="success"
                      size="sm"
                      onClick={() => handleApprove(proposal.id)}
                      disabled={isButtonDisabled(proposal)}
                    >
                      <CIcon icon={cilCheckCircle} className="me-1" />
                      Approve
                    </CButton>
                    <CButton
                      color="danger"
                      size="sm"
                      onClick={() => handleReject(proposal.id)}
                      disabled={isButtonDisabled(proposal)}
                    >
                      <CIcon icon={cilXCircle} className="me-1" />
                      Reject
                    </CButton>
                    <CButton
                      color="warning"
                      size="sm"
                      onClick={() => handleRevise(proposal)}
                      disabled={isButtonDisabled(proposal)}
                    >
                      <CIcon icon={cilSync} className="me-1" />
                      Revise
                    </CButton>
                  </CButtonGroup>
                </CCardBody>
              </CCard>
            ))
          ) : (
            <div className="text-center text-muted">
              <p>No proposals available for this group</p>
            </div>
          )}
        </CCardBody>
      </CCard>

      {/* Revision Modal */}
      <CModal visible={revisionModal} onClose={() => setRevisionModal(false)} size="sm">
        <CModalHeader>
          <CModalTitle>
            <small>Request Revision</small>
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CFormTextarea
            rows={4}
            value={revisionComment}
            onChange={(e) => setRevisionComment(e.target.value)}
            placeholder="Enter revision comments..."
          />
        </CModalBody>
        <CModalFooter>
          <CButton size="sm" color="secondary" onClick={() => setRevisionModal(false)}>
            Cancel
          </CButton>
          <CButton size="sm" color="primary" onClick={handleRevisionSubmit} disabled={loading}>
            {loading ? (
              <>
                <CSpinner size="sm" className="me-1" />
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </CButton>
        </CModalFooter>
      </CModal>

      <CustomToast toast={toast} setToast={setToast} />
    </CContainer>
  )
}

export default ProposalManagement