import React, { useEffect, useState } from 'react'
import Loading from '../../components/Loading'
import Title from '../../components/admin/Title'
import { dateFormat } from '../../lib/dateFormate'
import { useAppContext } from '../../context/AppContext'

const ListBooking = () => {

  const currency = import.meta.env.VITE_CURRENCY

  const { axios, getToken, user } = useAppContext()

  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const getAllBookings = async () => {
    try {
      const { data } = await axios.get(
        "/api/admin/all-bookings",
        {
          headers: {
            Authorization: `Bearer ${await getToken()}`
          }
        }
      )

      setBookings(data.bookings)
      setIsLoading(false)
    } catch (error) {
      console.error(error)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      getAllBookings()
    }
  }, [user])

  return !isLoading ? (
    <>
      <Title text1="List" text2="Booking" />

      <div className='max-w-4xl mt-6 overflow-x-auto'>
        <table className='w-full border-collapse rounded-md overflow-hidden text-nowrap'>
          <thead>
            <tr className='bg-primary/20 text-left text-white'>
              <th className='p-2 font-medium pl-5'>User Name</th>
              <th className='p-2 font-medium'>Movie Name</th>
              <th className='p-2 font-medium'>Show Time</th>
              <th className='p-2 font-medium'>Seates</th>
              <th className='p-2 font-medium'>Amount</th>
            </tr>
          </thead>

          <tbody className='text-sm font-light'>
            {bookings.map((item, index) => {
              const seats =
                Object.keys(item.bookedSeats || {})
                  .map(seat => item.bookedSeats[seat])
                  .join(",")

              return (
                <tr
                  key={index}
                  className='border-b border-primary/20 bg-primary/5 even:bg-primary/10'
                >
                  <td className='p-2 min-w-45 pl-5'>
                    {item.User?.name || "N/A"}
                  </td>

                  <td className='p-2'>
                    {item.Show?.Movie?.title || "N/A"}
                  </td>

                  <td className='p-2'>
                    {item.Show?.showDateTime
                      ? dateFormat(item.Show.showDateTime)
                      : "N/A"}
                  </td>

                  <td className='p-2'>
                    {seats}
                  </td>

                  <td className='p-2'>
                    {currency}{item.amount}
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

export default ListBooking
