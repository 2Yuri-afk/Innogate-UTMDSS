import React, { useState, useEffect } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { CButton } from '@coreui/react'
import { cilArrowLeft, cilArrowRight } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import EventModal from './EventModal'
import { fetchGroups, fetchMembersByGroup } from './firestoreUtils'
import {
  collection,
  getDocs,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore'
import { db } from 'src/backend/firebase'
import '@coreui/coreui/dist/css/coreui.min.css'
import { COffcanvas, COffcanvasHeader, COffcanvasBody } from '@coreui/react'
import CustomToast from 'src/components/Toast/CustomToast'

const MyCalendar = ({ selectable = false, showAddButton = false, role }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [editingEvent, setEditingEvent] = useState(null)
  const [allEvents, setAllEvents] = useState([])
  const [groupOptions, setGroupOptions] = useState([])
  const [eventDetails, setEventDetails] = useState(null)
  const [visible, setVisible] = useState(false)
  const [toast, setToast] = useState(null)

  const localizer = momentLocalizer(moment)

  useEffect(() => {
    const loadGroups = async () => {
      try {
        // Check if groups data is available in localStorage
        const storedGroups = localStorage.getItem('groups')
        if (storedGroups) {
          setGroupOptions(JSON.parse(storedGroups))
        } else {
          const groups = await fetchGroups()
          setGroupOptions(groups)
          localStorage.setItem('groups', JSON.stringify(groups))
        }
      } catch (error) {
        console.error('Error fetching groups:', error)
      }
    }
    loadGroups()
  }, [])

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'events'), (snapshot) => {
      const eventsData = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          title: data.title,
          start: data.start.toDate(),
          end: data.end.toDate(),
          group: data.group,
          room: data.room,
        }
      })
      setAllEvents(eventsData)
      // Store events in localStorage
      localStorage.setItem('events', JSON.stringify(eventsData))
    })

    // Check if events are available in localStorage
    const storedEvents = localStorage.getItem('events')
    if (storedEvents) {
      setAllEvents(JSON.parse(storedEvents))
    }

    return () => unsubscribe()
  }, [])

  const handleSelectSlot = (slotInfo) => {
    if (!selectable) return
    setSelectedDate(slotInfo.start)
    setEditingEvent(null)
    setIsModalOpen(true)
  }

  const handleEventClick = async (event) => {
    if (role === 'Admin') {
      setEditingEvent(event)
      setSelectedDate(event.start)
      setIsModalOpen(true)
    } else {
      const members = await fetchMembersByGroup(event.group)
      setEventDetails({
        ...event,
        members,
      })
      setVisible(true) // Set visibility to true when opening
    }
  }

  const handleOffcanvasClose = () => {
    setVisible(false)
    // Use a timeout to clear the event details after the animation completes
    setTimeout(() => {
      setEventDetails(null)
    }, 300) // Match this with your transition duration
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedDate(null)
    setEditingEvent(null)
  }

  const saveEvent = async (eventData) => {
    try {
      const conflictingEvent = allEvents.find((e) => {
        return (
          e.room === eventData.room &&
          e.id !== eventData.id &&
          ((eventData.start >= e.start && eventData.start < e.end) ||
            (eventData.end > e.start && eventData.end <= e.end) ||
            (eventData.start <= e.start && eventData.end >= e.end))
        )
      })

      if (conflictingEvent) {
        setToast({
          color: 'danger',
          message: `Conflict detected with event: ${conflictingEvent.title}`,
        })
        return
      }

      if (eventData.id) {
        const eventRef = doc(db, 'events', eventData.id)
        await updateDoc(eventRef, {
          title: eventData.title,
          start: eventData.start,
          end: eventData.end,
          group: eventData.group,
          room: eventData.room,
        })
        setToast({
          color: 'success',
          message: 'Event updated successfully',
        })
      } else {
        await addDoc(collection(db, 'events'), eventData)
        setToast({
          color: 'success',
          message: 'Event added successfully',
        })
      }

      handleCloseModal()
    } catch (error) {
      console.error('Error saving event:', error)
      setToast({
        color: 'danger',
        message: 'Failed to save event',
      })
    }
  }

  const deleteEvent = async (eventToDelete) => {
    try {
      await deleteDoc(doc(db, 'events', eventToDelete.id))
      handleCloseModal()
      setToast({
        color: 'success',
        message: 'Event deleted successfully',
      })
    } catch (error) {
      console.error('Error deleting event:', error)
      setToast({
        color: 'danger',
        message: 'Failed to delete event',
      })
    }
  }

  const CustomToolbar = (toolbar) => {
    const goToBack = () => toolbar.onNavigate('PREV')
    const goToNext = () => toolbar.onNavigate('NEXT')
    const goToCurrent = () => toolbar.onNavigate('TODAY')

    return (
      <div
        className="rbc-toolbar"
        style={{ display: 'flex', justifyContent: 'space-between', padding: '10px' }}
      >
        <span
          className="rbc-toolbar-label"
          style={{
            fontSize: '30px',
            fontWeight: 'bold',
            color: 'var(--cui-body-color)',
          }}
        >
          {toolbar.label}
        </span>
        <div>
          <CButton
            color="primary"
            onClick={goToBack}
            style={{ marginRight: '10px', color: 'var(--cui-body-color)' }}
          >
            <CIcon size="sm" icon={cilArrowLeft} style={{ marginRight: '3px' }} />
            Back
          </CButton>
          <CButton
            color="primary"
            onClick={goToCurrent}
            style={{ marginRight: '10px', color: 'var(--cui-body-color)' }}
          >
            Today
          </CButton>
          <CButton color="primary" onClick={goToNext} style={{ color: 'var(--cui-body-color)' }}>
            Next
            <CIcon size="sm" icon={cilArrowRight} style={{ marginLeft: '3px' }} />
          </CButton>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '75vh' }}>
      <Calendar
        localizer={localizer}
        events={allEvents}
        defaultView="month"
        views={['month']}
        components={{ toolbar: CustomToolbar }}
        selectable={selectable}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleEventClick}
        style={{ height: '100%' }}
      />
      {role === 'Admin' && (
        <EventModal
          isOpen={isModalOpen}
          onRequestClose={handleCloseModal}
          event={editingEvent}
          selectedDate={selectedDate}
          saveEvent={saveEvent}
          deleteEvent={deleteEvent}
          existingGroups={allEvents.filter((e) => e.id !== editingEvent?.id).map((e) => e.group)}
          existingRooms={allEvents.map((event) => event.room)}
        />
      )}
      {eventDetails && (
        <COffcanvas
          visible={visible}
          onHide={handleOffcanvasClose}
          placement="end"
          backdrop={true}
          style={{
            transition: 'transform 300ms ease-in-out',
          }}
        >
          <COffcanvasHeader style={{ justifyContent: 'space-between' }}>
            <h2>
              <strong>Schedule Details</strong>
            </h2>
            <CButton color="primary" shape="rounded-pill" onClick={handleOffcanvasClose}>
              Close
            </CButton>
          </COffcanvasHeader>
          <COffcanvasBody>
            <div id="boxes">
              <div id="box">
                <p>
                  <strong>Group:</strong> {eventDetails.group}
                </p>
                <p>
                  <strong>Room:</strong> {eventDetails.room}
                </p>
                <p>
                  <strong>Start:</strong>{' '}
                  {moment(eventDetails.start).format('MMMM Do YYYY, h:mm a')}
                </p>
                <p>
                  <strong>End:</strong> {moment(eventDetails.end).format('MMMM Do YYYY, h:mm a')}
                </p>
              </div>
              <div id="box-2">
                <p>
                  <strong>Members:</strong>
                </p>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {eventDetails.members.map((member) => (
                    <li
                      key={member.id}
                      style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}
                    >
                      <img
                        src={member.photoURL || '/default-profile.png'} // Fallback to a default image if `photoURL` is missing
                        alt={member.name}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          marginRight: '10px',
                        }}
                      />
                      <span>{member.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </COffcanvasBody>
        </COffcanvas>
      )}
      <CustomToast toast={toast} setToast={setToast} /> {/* Added CustomToast */}
    </div>
  )
}

export default MyCalendar
