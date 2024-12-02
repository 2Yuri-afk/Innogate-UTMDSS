import React from 'react'

// Student
const ScheduleStudent = React.lazy(() => import('./views/pages/student/schedule/scheduleStudent'))
const EditProfileStudent = React.lazy(() => import('./views/pages/student/editProfileStudent'))
const ThesisProposal = React.lazy(() => import('./views/pages/student/thesisProposal'))
const UploadManuscript = React.lazy(() => import('./views/pages/student/uploadManuscript'))
const GroupDetails = React.lazy(() => import('./views/pages/student/groupDetails'))

// Teacher
const ScheduleTeacher = React.lazy(() => import('./views/pages/teacher/schedule/scheduleTeacher'))
const EditProfileTeacher = React.lazy(() => import('./views/pages/teacher/editProfileTeacher'))
const ProposalManagement = React.lazy(() => import('./views/pages/teacher/proposalManagement'))
const MyStudents = React.lazy(() => import('./views/pages/teacher/myStudents'))

// Adviser
const ScheduleAdviser = React.lazy(() => import('./views/pages/adviser/schedule/scheduleAdviser'))
const EditProfileAdviser = React.lazy(() => import('./views/pages/adviser/editProfileAdviser'))
const GroupRequest = React.lazy(() => import('./views/pages/adviser/groupRequest'))
const ViewManuscript = React.lazy(() => import('./views/pages/adviser/viewManuscript'))

// Admin
const ScheduleAdmin = React.lazy(() => import('./views/pages/admin/schedule/scheduleAdmin'))
const EditProfileAdmin = React.lazy(() => import('./views/pages/admin/editProfileAdmin'))
const CreateAccount = React.lazy(() => import('./views/pages/admin/createAccount'))

const routes = [
  // Student
  {
    path: '/scheduleStudent',
    name: 'scheduleStudent',
    element: ScheduleStudent,
    allowedRoles: ['Student', 'Admin'],
  },
  {
    path: '/editProfileStudent',
    name: 'editProfileStudent',
    element: EditProfileStudent,
    allowedRoles: ['Student'],
  },
  {
    path: '/thesisProposal',
    name: 'thesisProposal',
    element: ThesisProposal,
    allowedRoles: ['Student'],
  },
  {
    path: '/uploadManuscript',
    name: 'uploadManuscript',
    element: UploadManuscript,
    allowedRoles: ['Student'],
  },
  { path: '/groupDetails', name: 'groupDetails', element: GroupDetails, allowedRoles: ['Student'] },

  // Teacher
  {
    path: '/scheduleTeacher',
    name: 'scheduleTeacher',
    element: ScheduleTeacher,
    allowedRoles: ['Teacher', 'Admin'],
  },
  {
    path: '/editProfileTeacher',
    name: 'editProfileTeacher',
    element: EditProfileTeacher,
    allowedRoles: ['Teacher'],
  },
  {
    path: '/proposalManagement',
    name: 'proposalManagement',
    element: ProposalManagement,
    allowedRoles: ['Teacher'],
  },
  { path: '/myStudents', name: 'myStudents', element: MyStudents, allowedRoles: ['Teacher'] },

  // Adviser
  {
    path: '/scheduleAdviser',
    name: 'scheduleAdviser',
    element: ScheduleAdviser,
    allowedRoles: ['Adviser', 'Admin'],
  },
  {
    path: '/editProfileAdviser',
    name: 'editProfileAdviser',
    element: EditProfileAdviser,
    allowedRoles: ['Adviser'],
  },
  { path: '/groupRequest', name: 'groupRequest', element: GroupRequest, allowedRoles: ['Adviser'] },
  {
    path: '/viewManuscript',
    name: 'viewManuscript',
    element: ViewManuscript,
    allowedRoles: ['Adviser'],
  },

  // Admin
  {
    path: '/scheduleAdmin',
    name: 'scheduleAdmin',
    element: ScheduleAdmin,
    allowedRoles: ['Admin'],
  },
  {
    path: '/editProfileAdmin',
    name: 'editProfileAdmin',
    element: EditProfileAdmin,
    allowedRoles: ['Admin'],
  },
  {
    path: '/createAccount',
    name: 'createAccount',
    element: CreateAccount,
    allowedRoles: ['Admin'],
  },
]

export default routes
