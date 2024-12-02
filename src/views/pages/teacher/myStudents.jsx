import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CFormCheck,
  CTable,
  CTableBody,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CTableDataCell,
} from '@coreui/react'
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from 'src/backend/firebase'
import CustomToast from 'src/components/Toast/CustomToast'
import { auth } from 'src/backend/firebase'

const colorPalette = ['#FF5733', '#33FF57', '#3357FF', '#FF33A6', '#A633FF', '#FF8333', '#33FF8A']

const MyStudents = () => {
  const [students, setStudents] = useState([])
  const [availableStudents, setAvailableStudents] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [enrollModalVisible, setEnrollModalVisible] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState([])
  const [selectedEnrollStudents, setSelectedEnrollStudents] = useState([])
  const [toast, setToast] = useState(null)
  const [teacherID, setTeacherID] = useState(null)

  useEffect(() => {
    const fetchTeacherData = async () => {
      const currentUser = auth.currentUser
      if (currentUser) {
        const querySnapshot = await getDocs(collection(db, 'users'))
        const teacher = querySnapshot.docs
          .map((doc) => ({ ...doc.data(), id: doc.id }))
          .find((user) => user.uid === currentUser.uid && user.role === 'Teacher')
        if (teacher) {
          setTeacherID(teacher.teacherID)
          fetchStudents(teacher.teacherID)
        }
      }
    }

    const fetchStudents = async (teacherID) => {
      const querySnapshot = await getDocs(collection(db, 'users'))
      const studentsList = querySnapshot.docs
        .map((doc) => ({ ...doc.data(), id: doc.id }))
        .filter((user) => user.role === 'Student' && user.myTeacher === teacherID)
      studentsList.sort((a, b) => (a.groupID || '').localeCompare(b.groupID || ''))
      setStudents(studentsList)
    }

    const fetchAvailableStudents = async () => {
      const querySnapshot = await getDocs(collection(db, 'users'))
      const availableList = querySnapshot.docs
        .map((doc) => ({ ...doc.data(), id: doc.id }))
        .filter((user) => user.role === 'Student' && !user.myTeacher)
      setAvailableStudents(availableList)
    }

    fetchTeacherData()
    fetchAvailableStudents()
  }, [])

  const toggleStudentSelection = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter((id) => id !== studentId))
    } else if (selectedStudents.length < 3) {
      setSelectedStudents([...selectedStudents, studentId])
    }
  }

  const toggleEnrollStudentSelection = (studentId) => {
    if (selectedEnrollStudents.includes(studentId)) {
      setSelectedEnrollStudents(selectedEnrollStudents.filter((id) => id !== studentId))
    } else {
      setSelectedEnrollStudents([...selectedEnrollStudents, studentId])
    }
  }

  const handleGroupStudents = async () => {
    if (selectedStudents.length < 1) {
      setToast({
        color: 'warning',
        message: 'Please select at least one student to group.',
      })
      return
    }

    const newGroupID = `group-${Date.now()}`
    try {
      await Promise.all(
        selectedStudents.map((studentId) =>
          updateDoc(doc(db, 'users', studentId), { groupID: newGroupID }),
        ),
      )
      setStudents(
        students
          .map((student) =>
            selectedStudents.includes(student.id) ? { ...student, groupID: newGroupID } : student,
          )
          .sort((a, b) => (a.groupID || '').localeCompare(b.groupID || '')),
      )
      setToast({
        color: 'success',
        message: 'Students grouped successfully!',
      })
      setModalVisible(false)
      setSelectedStudents([])
    } catch (error) {
      console.error('Error grouping students:', error)
      setToast({
        color: 'danger',
        message: `Error: ${error.message}`,
      })
    }
  }

  const handleEnrollStudents = async () => {
    if (selectedEnrollStudents.length < 1) {
      setToast({
        color: 'warning',
        message: 'Please select at least one student to enroll.',
      })
      return
    }

    try {
      await Promise.all(
        selectedEnrollStudents.map((studentId) =>
          updateDoc(doc(db, 'users', studentId), { myTeacher: teacherID }),
        ),
      )
      setStudents([
        ...students,
        ...availableStudents
          .filter((student) => selectedEnrollStudents.includes(student.id))
          .map((student) => ({ ...student, myTeacher: teacherID })),
      ])
      setToast({
        color: 'success',
        message: 'Students enrolled successfully!',
      })
      setEnrollModalVisible(false)
      setSelectedEnrollStudents([])
    } catch (error) {
      console.error('Error enrolling students:', error)
      setToast({
        color: 'danger',
        message: `Error: ${error.message}`,
      })
    }
  }

  const getGroupColor = (groupID) => {
    const groupIndex = [...new Set(students.map((s) => s.groupID))].indexOf(groupID)
    return colorPalette[groupIndex % colorPalette.length]
  }

  return (
    <CCard>
      <CCardHeader>
        <div className="d-flex justify-content-between align-items-center">
          <h5>My Students</h5>
          <div>
            <CButton color="primary" className="me-2" onClick={() => setEnrollModalVisible(true)}>
              Add Students
            </CButton>
            <CButton color="primary" onClick={() => setModalVisible(true)}>
              Group Students
            </CButton>
          </div>
        </div>
      </CCardHeader>
      <CCardBody>
        <CTable hover responsive small striped>
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell scope="col" style={{ width: '33%' }}>
                Name
              </CTableHeaderCell>
              <CTableHeaderCell scope="col" style={{ width: '33%' }}>
                Email
              </CTableHeaderCell>
              <CTableHeaderCell scope="col" style={{ width: '33%' }}>
                Group ID
              </CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {students.length === 0 ? (
              <CTableRow>
                <CTableDataCell colSpan={3} className="text-center">
                  No students enrolled.
                </CTableDataCell>
              </CTableRow>
            ) : (
              students.map((student, index) => (
                <CTableRow key={index}>
                  <CTableDataCell>{student.name}</CTableDataCell>
                  <CTableDataCell>{student.email}</CTableDataCell>
                  <CTableDataCell className="d-flex align-items-center">
                    {student.groupID && (
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          backgroundColor: getGroupColor(student.groupID),
                          borderRadius: '50%',
                          display: 'inline-block',
                          marginRight: '8px',
                        }}
                      ></span>
                    )}
                    {student.groupID || 'Not grouped'}
                  </CTableDataCell>
                </CTableRow>
              ))
            )}
          </CTableBody>
        </CTable>
      </CCardBody>

      {/* Group Students Modal */}
      <CModal visible={modalVisible} onClose={() => setModalVisible(false)}>
        <CModalHeader>
          <CModalTitle>Group Students</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CTable small>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell style={{ width: '20%' }} className="text-center">
                  Select
                </CTableHeaderCell>
                <CTableHeaderCell style={{ width: '40%' }}>Name</CTableHeaderCell>
                <CTableHeaderCell style={{ width: '40%' }}>Email</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {students
                .filter((student) => !student.groupID)
                .map((student) => (
                  <CTableRow key={student.id}>
                    <CTableDataCell className="text-center">
                      <CFormCheck
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => toggleStudentSelection(student.id)}
                        disabled={
                          selectedStudents.length === 3 && !selectedStudents.includes(student.id)
                        }
                      />
                    </CTableDataCell>
                    <CTableDataCell>{student.name}</CTableDataCell>
                    <CTableDataCell>{student.email}</CTableDataCell>
                  </CTableRow>
                ))}
            </CTableBody>
          </CTable>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setModalVisible(false)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleGroupStudents}>
            Confirm Group
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Enroll Students Modal */}
      <CModal visible={enrollModalVisible} onClose={() => setEnrollModalVisible(false)}>
        <CModalHeader>
          <CModalTitle>Enroll Students</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CTable small>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell style={{ width: '20%' }} className="text-center">
                  Select
                </CTableHeaderCell>
                <CTableHeaderCell style={{ width: '40%' }}>Name</CTableHeaderCell>
                <CTableHeaderCell style={{ width: '40%' }}>Email</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {availableStudents.map((student) => (
                <CTableRow key={student.id}>
                  <CTableDataCell className="text-center">
                    <CFormCheck
                      checked={selectedEnrollStudents.includes(student.id)}
                      onChange={() => toggleEnrollStudentSelection(student.id)}
                    />
                  </CTableDataCell>
                  <CTableDataCell>{student.name}</CTableDataCell>
                  <CTableDataCell>{student.email}</CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setEnrollModalVisible(false)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleEnrollStudents}>
            Enroll
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Custom Toast Notification */}
      <CustomToast toast={toast} setToast={setToast} />
    </CCard>
  )
}

export default MyStudents
