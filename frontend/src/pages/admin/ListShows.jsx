import React, { useEffect, useState } from 'react'
import Loading from '../../components/Loading'
import Title from '../../components/admin/Title'
import { dateFormat } from '../../lib/dateFormate'
import { useAppContext } from '../../context/AppContext'

const ListShows = () => {

  const currency = import.meta.env.VITE_CURRENCY
  const { axios, getToken, user } = useAppContext()

  const [shows, setShows] = useState([])
  const [loading, setLoading] = useState(true)

  const getAllShows = async () => {
    try {
      const { data } = await axios.get("/api/admin/all-shows", {
        headers: { Authorization: `Bearer ${await getToken()}` }
      })

      console.log("API RESPONSE:", data)

      setShows(Array.isArray(data.shows) ? data.shows : [])
      setLoading(false)

    } catch (error) {
      console.error(error)
      setShows([])
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      getAllShows()
    }
  }, [user])

  if (loading) return <Loading />

  return (
    <>
      <Title text1="List" text2="Shows" />

      <div className='max-w-4xl mt-6 overflow-x-auto'>
        <table className='w-full border-collapse rounded-md overflow-hidden text-nowrap'>

          {/* HEADER */}
          <thead>
            <tr className='bg-primary/20 text-left text-white'>
              <th className='p-2 font-medium pl-5'>Movie Name</th>
              <th className='p-2 font-medium'>Show Time</th>
              <th className='p-2 font-medium'>Total Bookings</th>
              <th className='p-2 font-medium'>Earnings</th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody className='text-sm font-light'>
            {shows.map((show, index) => {

              // ✅ CONDITION FOR SKY GREEN
              const isMissingOrZero =
                !show?.movieName ||
                show?.movieName === "N/A" ||
                show?.totalBookings === 0 ||
                show?.totalEarnings === 0

              return (
                <tr
                  key={index}

                  className={
                    isMissingOrZero
                      ? "border-b border-primary/10 bg-primary/5 text-sky-900"
                      : "border-b border-primary/10 bg-primary/5 even:bg-primary/10"
                  }
                >

                  <td className='p-2 pl-5'>
                    {show?.movieName || "N/A"}
                  </td>

                  <td className='p-2'>
                    {show?.showTime
                      ? dateFormat(show.showTime)
                      : "N/A"}
                  </td>

                  <td className='p-2'>
                    {show?.totalBookings ?? 0}
                  </td>

                  <td className='p-2 font-semibold'>
                    {currency}{show?.totalEarnings ?? 0}
                  </td>

                </tr>
              )
            })}
          </tbody>

        </table>
      </div>
    </>
  )
}

export default ListShows
