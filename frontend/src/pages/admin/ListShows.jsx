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

      setShows(data.shows)
      setLoading(false)
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      getAllShows()
    }
  }, [user])

  return !loading ? (
    <>
      <Title text1="List" text2="Shows" />

      <div className='max-w-4xl mt-6 overflow-x-auto'>
        <table className='w-full border-collapse rounded-md overflow-hidden text-nowrap'>
          <thead>
            <tr className='bg-primary/20 text-left text-white'>
              <th className='p-2 font-medium pl-5'>Movie Name</th>
              <th className='p-2 font-medium'>Show Time</th>
              <th className='p-2 font-medium'>Total Booklings</th>
              <th className='p-2 font-medium'>Earnings</th>
            </tr>
          </thead>

          <tbody className='text-sm font-light'>
            {shows.map((show, index) => {
              const seatsCount = Object.keys(show.occupiedSeats || {}).length

              return (
                <tr
                  key={index}
                  className='border-b border-primary/10 bg-primary/5 even:bg-primary/10'
                >
                  <td className='p-2 min-w-45 pl-5'>
                    {show.Movie?.title || "N/A"}
                  </td>

                  <td className='p-2'>
                    {dateFormat(show.showDateTime)}
                  </td>

                  <td className='p-2'>
                    {seatsCount}
                  </td>

                  <td className='p-2'>
                    {currency}{seatsCount * show.showPrice}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  ) : <Loading />
}

export default ListShows
