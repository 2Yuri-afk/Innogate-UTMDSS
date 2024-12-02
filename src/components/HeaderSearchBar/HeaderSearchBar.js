// HeaderSearchBar.js
import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { CFormInput, CForm, CListGroup, CListGroupItem } from '@coreui/react'
import { useRole } from 'src/RoleContext'

const HeaderSearchBar = () => {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const navigate = useNavigate()
  const role = useRole()

  // Define all pages with their descriptions
  const allPages = [
    {
      name: 'Edit Profile',
      path: '/editProfileStudent',
      description: 'Modify user information',
      roles: ['Student'],
    },
    {
      name: 'Thesis Proposal',
      path: '/thesisProposal',
      description: 'Manage thesis proposals',
      roles: ['Student'],
    },
    {
      name: 'Schedule',
      path: '/scheduleStudent',
      description: 'View and manage defense schedule',
      roles: ['Student'],
    },
    {
      name: 'Edit Profile',
      path: '/editProfileAdmin',
      description: 'Modify user information',
      roles: ['Admin'],
    },
    {
      name: 'Schedule',
      path: '/scheduleAdmin',
      description: 'View and manage defense schedule',
      roles: ['Admin'],
    },
    {
      name: 'Edit Profile',
      path: '/editProfileAdviser',
      description: 'Modify user information',
      roles: ['Adviser'],
    },
    {
      name: 'Schedule',
      path: '/scheduleAdviser',
      description: 'View and manage defense schedule',
      roles: ['Adviser'],
    },
    {
      name: 'Edit Profile',
      path: '/editProfileTeacher',
      description: 'Modify user information',
      roles: ['Teacher'],
    },
    {
      name: 'Schedule',
      path: '/scheduleTeacher',
      description: 'View and manage defense schedule',
      roles: ['Teacher'],
    },
    {
      name: 'Create Account',
      path: '/createAccount',
      description: 'Create new user accounts',
      roles: ['Admin'],
    },
    {
      name: 'My Students',
      path: '/myStudents',
      description: 'View students assigned to you',
      roles: ['Teacher'],
    },
    {
      name: 'Proposal Management',
      path: '/proposalManagement',
      description: 'Manage thesis proposals',
      roles: ['Teacher'],
    },
    {
      name: 'Upload Manuscript',
      path: '/uploadManuscript',
      description: 'Upload your thesis manuscript',
      roles: ['Student'],
    },
    {
      name: 'Group Details',
      path: '/groupDetails',
      description: 'View details of your group',
      roles: ['Student'],
    },
    {
      name: 'Group Request',
      path: '/groupRequest',
      description: 'Manage group requests',
      roles: ['Adviser'],
    },
    {
      name: 'View Manuscript',
      path: '/viewManuscript',
      description: 'View thesis manuscripts',
      roles: ['Adviser'],
    },
  ]

  const handleInputChange = (e) => {
    const searchTerm = e.target.value
    setQuery(searchTerm)

    if (searchTerm.length > 0) {
      const filteredSuggestions = allPages.filter(
        (page) =>
          page.name.toLowerCase().includes(searchTerm.toLowerCase()) && page.roles.includes(role),
      )
      setSuggestions(filteredSuggestions)
    } else {
      setSuggestions([])
    }
  }

  const handleSuggestionClick = (path) => {
    navigate(path)
    setQuery('')
    setSuggestions([])
  }

  return (
    <div
      className="search-bar-container position-relative"
      style={{ width: '100%', maxWidth: '600px' }}
    >
      <CForm className="d-flex">
        <CFormInput
          type="text"
          placeholder="Search..."
          value={query}
          onChange={handleInputChange}
          style={{
            borderRadius: '20px',
            paddingRight: '2rem',
          }}
        />
      </CForm>

      {suggestions.length > 0 && (
        <CListGroup className="position-absolute mt-1 w-100">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              style={{
                padding: '3px',
                borderRadius: '2px',
                border: '1px solid gray',
                backgroundColor: '#212631',
              }}
            >
              <CListGroupItem
                action
                onClick={() => handleSuggestionClick(suggestion.path)}
                style={{
                  cursor: 'pointer',
                  padding: '0.75rem 1rem',
                  border: 'none',
                }}
                className="d-flex flex-column"
              >
                <span style={{ fontWeight: '600' }}>{suggestion.name}</span>
                <small style={{ color: '#888' }}>{suggestion.description}</small>
              </CListGroupItem>
            </div>
          ))}
        </CListGroup>
      )}
    </div>
  )
}

export default HeaderSearchBar
