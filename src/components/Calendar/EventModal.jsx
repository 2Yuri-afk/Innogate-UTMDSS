import React, { useState, useEffect } from 'react'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CFormSelect,
  CFormInput,
} from '@coreui/react'
import moment from 'moment'
import { fetchGroups } from './firestoreUtils'

const EventModal = ({
  isOpen,
  onRequestClose,
  event,
  selectedDate,
  saveEvent,
  deleteEvent,
  existingGroups,
  existingRooms,
}) => {
  const [title, setTitle] = useState('')
  const [room, setRoom] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [allGroups, setAllGroups] = useState([])

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const groups = await fetchGroups()
        setAllGroups(groups)
      } catch (error) {
        console.error('Error fetching groups:', error)
      }
    }
    loadGroups()
  }, [])

  // Reset form when event or selectedDate changes
  useEffect(() => {
    if (event) {
      setTitle(event.title)
      setRoom(event.room)
      setStart(moment(event.start).format('YYYY-MM-DDTHH:mm'))
      setEnd(moment(event.end).format('YYYY-MM-DDTHH:mm'))
      setSelectedGroup(event.group)
    } else {
      setTitle('')
      setRoom('')
      setStart(moment(selectedDate).format('YYYY-MM-DDTHH:mm'))
      setEnd(moment(selectedDate).add(1, 'hour').format('YYYY-MM-DDTHH:mm'))
      setSelectedGroup('')
    }
  }, [event, selectedDate])

  const handleSave = () => {
    if (!selectedGroup || !room) {
      alert('Selecting a group and a room is required!')
      return
    }

    const eventData = {
      title: `${room} - ${selectedGroup}`,
      start: moment(start).toDate(),
      end: moment(end).toDate(),
      group: selectedGroup,
      room: room,
    }

    if (event) {
      eventData.id = event.id
    }

    saveEvent(eventData)
  }

  // Filter out groups that are already scheduled, except the current group if editing
  const groupOptions = allGroups.filter(
    (group) => !existingGroups.includes(group) || group === event?.group,
  )

  const roomOptions = ['Room 101', 'Room 102', 'Room 103', 'Room 104', 'Room 105']

  return (
    <CModal visible={isOpen} onClose={onRequestClose}>
      <CModalHeader closeButton>
        <CModalTitle>{event ? 'Edit Event' : 'Add Event'}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <div className="mb-3">
          <label className="form-label">Group:</label>
          <CFormSelect value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
            <option value="">Select Group</option>
            {groupOptions.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </CFormSelect>
        </div>
        <div className="mb-3">
          <label className="form-label">Room:</label>
          <CFormSelect value={room} onChange={(e) => setRoom(e.target.value)}>
            <option value="">Select Room</option>
            {roomOptions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </CFormSelect>
        </div>
        <div className="mb-3">
          <label className="form-label">Start Time:</label>
          <CFormInput
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            min="2024-01-01T08:00"
            max="2024-12-31T20:00"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">End Time:</label>
          <CFormInput
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            min={start} // Ensure the end time is always after the start time
            max="2024-12-31T20:00"
          />
        </div>
      </CModalBody>
      <CModalFooter>
        <CButton color="primary" onClick={handleSave}>
          {event ? 'Update' : 'Save'}
        </CButton>
        {event && (
          <CButton color="danger" onClick={() => deleteEvent(event)}>
            Delete
          </CButton>
        )}
        <CButton color="secondary" onClick={onRequestClose}>
          Cancel
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default EventModal
