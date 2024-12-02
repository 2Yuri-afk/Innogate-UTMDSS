import React, { useState, useEffect } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormTextarea,
  CRow,
  CFormSelect,
  CContainer,
  CModal,
  CModalHeader,
  CModalFooter,
  CModalBody,
  CModalTitle,
  CSpinner,
} from '@coreui/react'
import CustomToast from 'src/components/Toast/CustomToast'
import { cilPlus, cilDataTransferDown } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import { db } from 'src/backend/firebase' // Import Firestore config
import { collection, addDoc, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, getUserRole, storage } from 'src/backend/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

const ThesisProposal = () => {
  const [forms, setForms] = useState([]) // Initialize with an empty array
  const [userRole, setUserRole] = useState(null)
  const [userGroupID, setUserGroupID] = useState(null) // State for user's groupID
  const [submittingIndex, setSubmittingIndex] = useState(null) // Track which button is currently submitting
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedFormIndex, setSelectedFormIndex] = useState(null)
  const [loading, setLoading] = useState(null)
  const [loadingStates, setLoadingStates] = useState({})
  const [fileUploadingStates, setFileUploadingStates] = useState({})
  const [toast, setToast] = useState(null)
  const [formLoading, setFormLoading] = useState(false)

  // Fetch user role and groupID when the component mounts
  useEffect(() => {
    const fetchUserDetails = async () => {
      const user = auth.currentUser
      if (user) {
        const role = await getUserRole(user.uid)
        setUserRole(role)

        // Fetch the user's groupID from the 'users' collection
        const userDoc = doc(db, 'users', user.uid) // Assuming user information is stored in 'users' collection
        const userSnapshot = await getDoc(userDoc)
        if (userSnapshot.exists()) {
          setUserGroupID(userSnapshot.data().groupID) // Adjust based on your Firestore structure
        }
      }
    }

    fetchUserDetails()
  }, [])

  // Fetch proposals from Firestore when the component mounts
  useEffect(() => {
    const fetchProposals = async () => {
      const user = auth.currentUser
      if (!user || !userGroupID) return

      try {
        const querySnapshot = await getDocs(collection(db, 'proposals'))
        const proposalsData = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          // Include ALL proposals for the user's group
          if (data.groupID === userGroupID) {
            proposalsData.push({
              id: doc.id,
              ...data,
              // All group members can edit if the proposal is not final
              editable:
                data.status === 'needs_revision' || (!data.submitted && data.status !== 'rejected'),
            })
          }
        })

        // Sort proposals to ensure consistent order
        proposalsData.sort((a, b) => {
          // Prioritize forms that need revision or are in draft state
          if (a.status === 'needs_revision') return -1
          if (b.status === 'needs_revision') return 1
          if (!a.submitted) return -1
          if (!b.submitted) return 1
          return 0
        })

        setForms(proposalsData)
      } catch (error) {
        console.error('Error fetching proposals:', error)
        setToast({
          color: 'danger',
          message: 'Error fetching proposals',
        })
      }
    }

    fetchProposals()
  }, [userGroupID])

  const getLoadingState = (index) => {
    return loadingStates[index] || false // Default to false if not set
  }

  const getFileUploadingState = (index) => {
    return fileUploadingStates[index] || false // Default to false if not set
  }

  const isFormEditable = (form) => {
    return form.status === 'needs_revision' || (form.status !== 'rejected' && !form.submitted)
  }

  // Firestore submission logic
  const handleSubmit = async () => {
    const index = selectedFormIndex
    if (userRole !== 'Student') {
      setToast({
        color: 'danger',
        message: 'Error: Only students can submit proposals',
      })
      return
    }

    const form = forms[index]

    if (!form.title || !form.description || !form.client || !form.field || !form.abstractForm) {
      setToast({
        color: 'danger',
        message: 'Please fill in all fields before submitting.',
      })
      return
    }

    try {
      setLoading(true)
      setSubmittingIndex(index)

      if (form.id) {
        const proposalRef = doc(db, 'proposals', form.id)
        await updateDoc(proposalRef, {
          ...form,
          submitted: true,
          status: 'pending',
          teacherComment: '',
          lastUpdated: new Date().toISOString(),
        })

        setForms((prevForms) => {
          const updatedForms = [...prevForms]
          updatedForms[index] = {
            ...updatedForms[index],
            submitted: true,
            editable: false,
            status: 'pending',
            teacherComment: '',
          }
          return updatedForms
        })

        setToast({
          color: 'success',
          message:
            form.status === 'needs_revision'
              ? 'Revised proposal submitted!'
              : 'Proposal submitted!',
        })
      } else {
        setToast({
          color: 'danger',
          message: 'Please save your proposal before submitting.',
        })
      }
    } catch (error) {
      setToast({
        color: 'danger',
        message: `Error: ${error.message}`,
      })
    } finally {
      setSubmittingIndex(null)
      setLoading(false)
      setShowConfirmModal(false)
    }
  }

  const handleFieldChange = (index, field, value) => {
    setForms((prevForms) => {
      const updatedForms = [...prevForms]
      updatedForms[index] = { ...updatedForms[index], [field]: value } // Update field without affecting submitted state
      return updatedForms
    })
  }

  const handleFileUpload = async (file, index) => {
    if (!file) return // Exit if no file is provided

    // Create a storage reference
    const storageRef = ref(storage, `abstractForms/${file.name}`)

    try {
      setFileUploadingStates((prevStates) => ({ ...prevStates, [index]: true }))
      // Upload file to Firebase Storage
      const snapshot = await uploadBytes(storageRef, file)

      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref)

      // Update the form with the download URL
      setForms((prevForms) => {
        const updatedForms = [...prevForms]
        updatedForms[index] = { ...updatedForms[index], abstractForm: downloadURL } // Store the download URL in abstractForm
        console.log('Updated form:', updatedForms)
        return updatedForms
      })

      console.log('File uploaded successfully:', downloadURL)
    } catch (error) {
      setToast({
        color: 'danger',
        message: 'Error uploading file',
      })
    } finally {
      setFileUploadingStates((prevStates) => ({ ...prevStates, [index]: false }))
    }
  }

  const handleFileChange = (e, index) => {
    const file = e.target.files[0] // Get the selected file
    handleFileUpload(file, index) // Call the upload function
  }

  const addNewProposalForm = () => {
    setForms((prevForms) => [
      ...prevForms,
      {
        id: null,
        title: '',
        description: '',
        client: '',
        field: '',
        abstractForm: '',
        editable: true,
        submitted: false,
      }, // Add new empty form with no ID
    ])
  }

  const handleEdit = (index) => {
    setForms((prevForms) => {
      const updatedForms = [...prevForms]
      updatedForms[index] = { ...updatedForms[index], editable: true } // Set editable state to true
      return updatedForms
    })
  }
  const handleSave = async (index) => {
    const form = forms[index]

    try {
      setLoadingStates((prevStates) => ({ ...prevStates, [index]: true }))

      // Create an update object that only includes defined fields
      const updateData = {
        title: form.title,
        description: form.description,
        client: form.client,
        field: form.field,
        abstractForm: form.abstractForm,
        status: form.status === 'needs_revision' ? 'pending' : form.status,
        groupID: userGroupID,
        lastUpdated: new Date().toISOString(),
      }

      // Only add teacherComment if it exists
      if (form.teacherComment !== undefined) {
        updateData.teacherComment = form.status === 'needs_revision' ? '' : form.teacherComment
      }

      if (form.id) {
        const proposalRef = doc(db, 'proposals', form.id)
        await updateDoc(proposalRef, updateData)

        setForms((prevForms) => {
          const updatedForms = [...prevForms]
          updatedForms[index] = {
            ...updatedForms[index],
            // Keep form editable if it needs revision
            editable: form.status === 'needs_revision' || !form.submitted,
            status: form.status === 'needs_revision' ? 'pending' : form.status,
            teacherComment: form.status === 'needs_revision' ? '' : form.teacherComment,
          }
          return updatedForms
        })

        setToast({
          color: 'success',
          message:
            form.status === 'needs_revision'
              ? 'Revision saved successfully!'
              : 'Proposal saved successfully!',
        })
      } else {
        // Similar modification for addDoc
        const newDoc = await addDoc(collection(db, 'proposals'), {
          ...updateData,
          submitted: false,
          status: 'draft',
        })

        setForms((prevForms) =>
          prevForms.map((item, idx) =>
            idx === index ? { ...item, id: newDoc.id, editable: false, status: 'draft' } : item,
          ),
        )

        setToast({
          color: 'success',
          message: 'New proposal saved successfully!',
        })
      }
    } catch (error) {
      setToast({
        color: 'danger',
        message: `Error saving proposal: ${error.message}`,
      })
    } finally {
      setLoadingStates((prevStates) => ({ ...prevStates, [index]: false }))
    }
  }

  const openConfirmModal = (index) => {
    setSelectedFormIndex(index)
    setShowConfirmModal(true)
  }

  const getCardStyle = (status) => {
    switch (status) {
      case 'rejected':
        return {
          borderColor: '#dc3545',
          borderWidth: '2px',
        }
      case 'accepted':
        return {
          borderColor: '#28a745',
          borderWidth: '2px',
        }
      default:
        return {}
    }
  }

  // Update the render forms function
  const renderForms = () => {
    return (
      <TransitionGroup>
        {forms.map((form, index) => (
          <CSSTransition key={index} timeout={500} classNames="fade">
            <CCol xs={12}>
              <CCard className="mb-4" style={getCardStyle(form.status)}>
                <CCardHeader>
                  <strong>Thesis Proposal Form {index + 1}</strong>
                  {form.status === 'approved' && (
                    <span className="ms-2 text-success">
                      <CIcon icon={cilCheckCircle} className="me-1" />
                      (APPROVED)
                    </span>
                  )}
                  {form.status === 'rejected' && (
                    <span className="ms-2 text-danger">(REJECTED)</span>
                  )}
                </CCardHeader>
                <CCardBody>
                  {/* Show approval message */}
                  {form.status === 'accepted' && (
                    <div className="alert alert-success mb-3">✅ Proposal Accepted .</div>
                  )}

                  {/* Status message for rejected proposals */}
                  {form.status === 'rejected' && (
                    <div className="alert alert-danger mb-3">
                      ❌ This proposal has been rejected.
                    </div>
                  )}

                  {form.status === 'needs_revision' && (
                    <div className="alert alert-warning mb-3">
                      <strong>🔄 Revision Required</strong>
                      <p>Teacher's Comments: {form.teacherComment}</p>
                    </div>
                  )}

                  {/* Rest of the form remains the same */}

                  {/* Title Field */}
                  <div className="mb-3">
                    <CFormLabel>Title</CFormLabel>
                    <CFormInput
                      value={form.title}
                      onChange={(e) => handleFieldChange(index, 'title', e.target.value)}
                      disabled={!form.editable || form.status === 'rejected'}
                    />
                  </div>

                  {/* Description Field */}
                  <div className="mb-3">
                    <CFormLabel>Description</CFormLabel>
                    <CFormTextarea
                      rows={3}
                      value={form.description}
                      onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
                      disabled={!form.editable || form.status === 'rejected'}
                    />
                  </div>

                  {/* Rest of the form remains the same */}
                  <CRow>
                    <CCol md={4}>
                      <div className="mb-3">
                        <CFormLabel>Client</CFormLabel>
                        <CFormInput
                          value={form.client}
                          onChange={(e) => handleFieldChange(index, 'client', e.target.value)}
                          disabled={!form.editable || form.status === 'rejected'}
                        />
                      </div>
                    </CCol>

                    <CCol md={4}>
                      <div className="mb-3">
                        <CFormLabel>Field</CFormLabel>
                        <CFormSelect
                          value={form.field}
                          onChange={(e) => handleFieldChange(index, 'field', e.target.value)}
                          disabled={!form.editable || form.status === 'rejected'}
                          className={form.status === 'rejected' ? 'bg-light' : ''}
                        >
                          <option value="">Select Field</option>
                          <option value="field1">Field 1</option>
                          <option value="field2">Field 2</option>
                          <option value="field3">Field 3</option>
                          <option value="field4">Field 4</option>
                        </CFormSelect>
                      </div>
                    </CCol>

                    <CCol md={4}>
                      <div className="mb-3">
                        <CFormLabel>Abstract Form (PDF)</CFormLabel>
                        <div className="custom-file-upload">
                          {getFileUploadingState(index) ? (
                            <div className="d-flex align-items-center">
                              <CSpinner size="sm" className="me-2" />
                              <span>Uploading...</span>
                            </div>
                          ) : (
                            <>
                              <input
                                type="file"
                                id={`fileInput-${index}`}
                                onChange={(e) => handleFileChange(e, index)}
                                accept=".pdf"
                                style={{ display: 'none' }}
                                disabled={form.status === 'rejected'}
                              />
                              <CButton
                                className="w-100"
                                color="secondary"
                                variant="outline"
                                onClick={() =>
                                  document.getElementById(`fileInput-${index}`).click()
                                }
                                disabled={!form.editable || form.status === 'rejected'}
                              >
                                {form.abstractForm ? 'Change File' : 'Upload File'}
                              </CButton>
                              {form.abstractForm && (
                                <small className="text-secondary ms-2">File Uploaded!</small>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </CCol>
                  </CRow>

                  {/* Buttons */}

                  <CRow className="mt-3">
                    <CCol className="d-flex justify-content-end">
                      {form.status === 'approved' ? (
                        <CButton color="success" disabled>
                          <CIcon icon={cilCheckCircle} className="me-1" />
                          Approved
                        </CButton>
                      ) : // Existing button logic for other statuses
                      form.status === 'needs_revision' ||
                        (!form.submitted && form.status !== 'rejected') ? (
                        <>
                          {form.editable ? (
                            <CButton
                              style={{ marginRight: '10px' }}
                              color="success"
                              onClick={() => handleSave(index)}
                            >
                              {getLoadingState(index) ? (
                                <>
                                  <CSpinner size="sm" /> Save
                                </>
                              ) : (
                                'Save'
                              )}
                            </CButton>
                          ) : (
                            <CButton
                              style={{ marginRight: '10px' }}
                              color="primary"
                              onClick={() => handleEdit(index)}
                            >
                              Edit
                            </CButton>
                          )}
                          <CButton
                            color="primary"
                            onClick={() => openConfirmModal(index)}
                            disabled={submittingIndex === index}
                          >
                            {form.status === 'needs_revision' ? 'Submit Revision' : 'Submit'}
                          </CButton>
                        </>
                      ) : (
                        <CButton color="secondary" disabled>
                          {form.status === 'rejected'
                            ? 'Rejected'
                            : form.status === 'pending'
                              ? 'Pending Review'
                              : form.status === 'accepted'
                                ? 'Approved'
                                : 'Submitted'}
                        </CButton>
                      )}
                    </CCol>
                  </CRow>
                </CCardBody>
              </CCard>
            </CCol>
          </CSSTransition>
        ))}
      </TransitionGroup>
    )
  }

  const handleDownload = () => {
    const fileUrl = 'src/assets/TopicAbstractFormTemplate.docx'
    const link = document.createElement('a')
    link.href = fileUrl
    link.setAttribute('download', 'TopicAbstractFormTemplate.docx')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <CContainer>
      {formLoading ? (
        <>
          <div className="d-flex justify-content-center">
            <CSpinner size="m" color="primary" className="m-5" />
          </div>
        </>
      ) : (
        renderForms()
      )}

      <div className="d-flex justify-content-center gap-3">
        <CButton onClick={handleDownload} color="primary" variant="outline" className="mb-3">
          <CIcon icon={cilDataTransferDown} /> Abstract Form Template
        </CButton>
        <CButton
          onClick={addNewProposalForm}
          color="primary"
          className="mb-3"
          disabled={forms.some((form) => form.status === 'needs_revision')} // Disable if any form needs revision
        >
          <CIcon icon={cilPlus} /> Add New Proposal
        </CButton>
      </div>

      <CModal visible={showConfirmModal} onClose={() => setShowConfirmModal(false)}>
        <CModalHeader>
          <CModalTitle>
            {forms[selectedFormIndex]?.status === 'needs_revision'
              ? 'Confirm Revision Submission'
              : 'Confirm Submission'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {forms[selectedFormIndex]?.status === 'needs_revision'
            ? 'Are you sure you want to submit this revision? This will reset the proposal status to pending.'
            : 'Are you sure you want to submit this proposal? This cannot be undone.'}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <CSpinner size="sm" /> Confirming
              </>
            ) : forms[selectedFormIndex]?.status === 'needs_revision' ? (
              'Submit Revision'
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

export default ThesisProposal
