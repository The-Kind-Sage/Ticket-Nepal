import React from 'react'
import { assets } from '../../assets/assets'
import { LayoutDashboardIcon, ListCollapseIcon, ListIcon, PlusSquareIcon, LogOutIcon } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useUser, useClerk } from '@clerk/clerk-react'

const AdminSidebar = () => {
  const { user } = useUser()
  const { signOut } = useClerk()
  const navigate = useNavigate()

  const adminNavlinks = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboardIcon },
    { name: 'Add Shows', path: '/admin/add-shows', icon: PlusSquareIcon },
    { name: 'List Shows', path: '/admin/list-shows', icon: ListIcon },
    { name: 'List Bookings', path: '/admin/list-bookings', icon: ListCollapseIcon },
    { name: 'Add Movie', path: '/admin/add-movie', icon: PlusSquareIcon },
  ]

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className='h-[calc(100vh-64px)] md:flex flex-col items-center pt-8 max-w-13 md:max-w-60 w-full border-r border-gray-300/20 text-sm'>

      <img
        className='h-9 md:h-14 w-9 md:w-14 rounded-full mx-auto object-cover'
        src={user?.imageUrl || assets.profile}
        alt="admin"
      />
      <p className='mt-2 text-base max-md:hidden font-medium truncate px-2 text-center'>
        {user?.firstName} {user?.lastName}
      </p>
      <p className='text-xs text-gray-500 max-md:hidden truncate px-2 text-center mb-2'>
        {user?.primaryEmailAddress?.emailAddress}
      </p>

      <div className='w-full flex-1'>
        {adminNavlinks.map((link, index) => (
          <NavLink
            key={index}
            to={link.path}
            end
            className={({ isActive }) =>
              `relative flex items-center max-md:justify-center gap-2 w-full py-2.5 md:pl-10 first:mt-6 text-gray-400 ${isActive && 'bg-primary/15 text-primary group'}`
            }
          >
            {({ isActive }) => (
              <>
                <link.icon className='w-5 h-5' />
                <p className='max-md:hidden'>{link.name}</p>
                <span className={`w-1.5 h-10 rounded-1 right-0 absolute ${isActive && 'bg-primary'}`} />
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className='flex items-center max-md:justify-center gap-2 w-full py-3 md:pl-10 mb-4 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors'
      >
        <LogOutIcon className='w-5 h-5' />
        <p className='max-md:hidden'>Logout</p>
      </button>

    </div>
  )
}

export default AdminSidebar
