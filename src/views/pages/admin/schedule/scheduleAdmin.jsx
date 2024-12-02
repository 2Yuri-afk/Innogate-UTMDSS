import React, { useState, useRef, useEffect } from 'react'
import { CCard, CCardBody } from '@coreui/react'

import MyCalendar from 'src/components/Calendar/MyCalendar'

export default function schedule({ showAddButton }) {
  return (
    <>
      <CCard>
        <CCardBody>
          <MyCalendar selectable={true} showAddButton={true} role="Admin" />
        </CCardBody>
      </CCard>
    </>
  )
}
