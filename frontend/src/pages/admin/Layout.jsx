import React, { useEffect } from 'react'
import AdminNavBar  from '../../components/admin/AdminNavBar'
import AdminSidebar from '../../components/admin/AdminSidebar'
import { Outlet } from 'react-router-dom'
import { useAppContext } from '../../context/AppContext'
import Loading from '../../components/Loading'

const Layout = () => {

const { isAdmin, fetchIsAdmin} = useAppContext()

useEffect(() => {
  fetchIsAdmin();
}, [])

  return  isAdmin ?(
    <>

    <AdminNavBar/>
    <div className='flex'>
        <AdminSidebar />
        <div className='flex-1 px-4 py-10 h-[calc(100vh-64px)] overflow-y-auto'>
            <Outlet/>
        </div>
    </div>
    </>
  ): 
  <Loading />
}

export default Layout