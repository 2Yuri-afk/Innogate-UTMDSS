// CustomToast.js
import React from 'react'
import { CToaster, CToast, CToastBody, CToastHeader } from '@coreui/react'

const CustomToast = ({ toast, setToast }) => {
  if (!toast) return null

  return (
    <CToaster placement="top-end" className="mt-3" style={{ marginRight: '20px' }}>
      <CToast autohide={true} visible={true} onClose={() => setToast(null)} delay={1500}>
        <CToastHeader closeButton>
          <svg
            className="rounded me-2"
            width="20"
            height="20"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
            focusable="false"
            role="img"
          >
            <rect
              width="100%"
              height="100%"
              fill={
                toast.color === 'danger'
                  ? 'red'
                  : toast.color === 'warning' || toast.color === 'success'
                    ? 'green'
                    : 'gray'
              }
            />
          </svg>
          <div className="fw-bold me-auto">
            {toast.color === 'success' || toast.color === 'warning' ? 'Success!' : 'Error'}
          </div>
        </CToastHeader>
        <CToastBody>{toast.message}</CToastBody>
      </CToast>
    </CToaster>
  )
}

export default CustomToast
