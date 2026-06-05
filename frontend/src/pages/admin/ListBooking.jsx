import React, { useEffect, useState } from 'react'
import Loading from '../../components/Loading'
import Title from '../../components/admin/Title'
import { dateFormat } from '../../lib/dateFormate'
import { useAppContext } from '../../context/AppContext'
import { Eye, X, CheckCircle, Edit3, Info } from 'lucide-react'
import { toast } from 'react-toastify'

const ListBooking = () => {
  const currency = import.meta.env.VITE_CURRENCY
  const { axios, getToken, user } = useAppContext()

  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [refundDetail, setRefundDetail] = useState(null)
  const [editingBookingId, setEditingBookingId] = useState(null)
  const [editBookingPayload, setEditBookingPayload] = useState({ amount: "", status: "Hold" })

  const getAllBookings = async () => {
    try {
      const { data } = await axios.get("/api/admin/all-bookings", {
        headers: { Authorization: `Bearer ${await getToken()}` }
      })
      setBookings(Array.isArray(data.bookings) ? data.bookings : [])
      setIsLoading(false)
    } catch (error) {
      console.error(error)
      setIsLoading(false)
    }
  }

  const handleViewRefund = async (bookingId, rowRefund) => {
    if (rowRefund) {
      setRefundDetail({ ...rowRefund, bookingId });
      setShowModal(true);
      return;
    }

    try {
      const token = await getToken()
      const { data } = await axios.get(`/api/admin/refund-details/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (data.success) {
        setRefundDetail({ ...data.refund, bookingId })
        setShowModal(true)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error("View refund error:", error)
      toast.error("Error fetching data")
    }
  }

  const markAsRefunded = async (bookingId) => {
    if (!window.confirm("Are you sure you want to approve this refund and mark it as completed?")) return
    try {
      const token = await getToken()
      const { data } = await axios.post(`/api/admin/complete-refund`, { bookingId }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (data.success) {
        toast.success("Refund Processed Successfully")
        setShowModal(false)
        getAllBookings() // This refreshes the list so the "View" button disappears
      }
    } catch (error) {
      console.error("Mark as refunded error:", error)
      toast.error("Action failed")
    }
  }

  const startBookingEdit = (item) => {
    setEditingBookingId(item._id)
    setEditBookingPayload({
      amount: item.amount?.toString() || "",
      status: item.status || (item.isPaid ? "Paid" : "Hold"),
    })
  }

  const saveBookingEdit = async (bookingId) => {
    try {
      const token = await getToken()
      const { data } = await axios.put(`/api/admin/update-booking/${bookingId}`, {
        amount: Number(editBookingPayload.amount),
        status: editBookingPayload.status,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (data.success) {
        toast.success("Booking updated")
        setBookings((prev) => prev.map((b) => b._id === bookingId ? { ...b, ...data.booking } : b))
        setEditingBookingId(null)
      } else {
        toast.error(data.message || "Update failed")
      }
    } catch (error) {
      console.error("Save booking edit error:", error)
      toast.error("Update failed")
    }
  }

  const cancelBookingEdit = () => {
    setEditingBookingId(null)
    setEditBookingPayload({ amount: "", isPaid: false })
  }

  useEffect(() => { if (user) getAllBookings() }, [user])

  if (isLoading) return <Loading />

  return (
    <>
      <Title text1="List" text2="Booking" />
      <div className='max-w-6xl mt-6 overflow-x-auto bg-[#111] p-4 rounded-lg border border-white/5'>
        <table className='w-full border-collapse text-nowrap'>
          <thead>
            <tr className='bg-primary/10 text-left text-white border-b border-white/10'>
              <th className='p-3 pl-5 font-bold uppercase text-[11px] tracking-wider'>Action</th>
              <th className='p-3 pl-5 font-bold uppercase text-[11px] tracking-wider'>User</th>
              <th className='p-3 font-bold uppercase text-[11px] tracking-wider'>Movie</th>
              <th className='p-3 font-bold uppercase text-[11px] tracking-wider'>Show Time</th>
              <th className='p-3 font-bold uppercase text-[11px] tracking-wider'>Seats</th>
              <th className='p-3 font-bold uppercase text-[11px] tracking-wider'>Amount</th>
              <th className='p-3 font-bold uppercase text-[11px] tracking-wider'>Status</th>
              <th className='p-3 font-bold uppercase text-[11px] tracking-wider text-center'>Refund Action</th>
            </tr>
          </thead>
          <tbody className='text-sm text-gray-300'>
            {bookings.map((item, index) => (
              <tr key={index} className='border-b border-white/5 hover:bg-white/5 transition-all'>
                <td className='p-3 pl-5'>
                  <button
                    onClick={() => startBookingEdit(item)}
                    className='p-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded border border-blue-600/30 transition'
                    title='Edit Booking'
                  >
                    <Edit3 size={14} />
                  </button>
                </td>
                <td className='p-3 pl-5 font-medium'>{item?.User?.name || "N/A"}</td>
                <td className='p-3'>{item?.Show?.Movie?.title || "N/A"}</td>
                <td className='p-3 font-mono text-xs'>{item?.Show?.showTime ? dateFormat(item.Show.showTime) : "N/A"}</td>
                <td className='p-3 text-primary font-bold'>{Array.isArray(item?.seats) ? item.seats.join(", ") : "N/A"}</td>
                <td className='p-3'>{currency}{item?.amount || 0}</td>
                <td className='p-3'>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item?.isPaid ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"}`}>
                    {item?.isPaid ? "Paid" : "Pending/Hold"}
                  </span>
                </td>
                <td className='p-3 text-center'>
                  {/* LOGIC: Hide "View Request" if status is "Refunded" or "Completed" */}
                  {item.status === "Refunded" || item.refundStatus === "Completed" ? (
                    <div className="flex items-center justify-center gap-1 text-green-500 font-bold text-xs italic">
                      <CheckCircle size={14} /> Processed
                    </div>
                  ) : item.refundRequested ? (
                    <button 
                      onClick={() => handleViewRefund(item._id, item.Refund)} 
                      className="mx-auto bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1 text-xs transition-colors shadow-lg shadow-red-500/20"
                    >
                      <Eye size={14} /> View Request
                    </button>
                  ) : (
                    <span className="text-gray-600 italic text-xs">No Request</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Booking Modal */}
      {editingBookingId && (
        <div className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-white/10 w-full max-w-md rounded-2xl p-6 relative shadow-2xl">
            <button onClick={cancelBookingEdit} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Edit3 size={20} className="text-blue-500" /> Edit Booking
            </h2>

            <div className="space-y-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Amount</label>
                <input
                  type="number"
                  min="0"
                  value={editBookingPayload.amount}
                  onChange={(e) => setEditBookingPayload((prev) => ({ ...prev, amount: e.target.value }))}
                  className="w-full bg-black/50 px-3 py-2 rounded-lg mt-1 border border-white/10 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Update Status</label>
                <select
                  value={editBookingPayload.status}
                  onChange={(e) => setEditBookingPayload((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full bg-black/50 px-3 py-2 rounded-lg mt-1 border border-white/10 text-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                >
                  <option value="Paid">Paid</option>
                  <option value="Refunded">Refunded</option>
                  <option value="Hold">Hold</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => saveBookingEdit(editingBookingId)}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-600/20"
                >Save Changes</button>
                <button
                  onClick={cancelBookingEdit}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all"
                >Discard</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Details Modal */}
      {showModal && refundDetail && (
        <div className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-white/10 w-full max-w-md rounded-2xl p-8 relative shadow-2xl animate-in zoom-in-95 duration-300">
            <button onClick={() => setShowModal(false)} className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-black text-white mb-6 tracking-tight">Refund Request</h2>
            
            <div className="space-y-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1 block">User Email</label>
                <p className="text-white font-medium">{refundDetail.email}</p>
              </div>
              
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1 block">Payment Mobile (eSewa/Khalti)</label>
                <p className="text-primary font-black text-xl tracking-tight">{refundDetail.phone}</p>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1 block">Reason for Cancellation</label>
                <p className="text-gray-300 italic leading-relaxed text-sm">"{refundDetail.reason}"</p>
              </div>

              <div className="flex gap-3 items-center p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                 <Info size={20} className="text-yellow-500 shrink-0" />
                 <p className="text-[11px] text-yellow-200/70 leading-tight">By clicking approve, you confirm that the money has been sent back to the user via the mobile number above.</p>
              </div>

              {/* Action Button logic inside Modal */}
              <button 
                onClick={() => markAsRefunded(refundDetail.bookingId)} 
                className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 mt-4 transition-all shadow-xl shadow-green-600/20 active:scale-95 uppercase text-xs tracking-widest"
              >
                <CheckCircle size={18} /> Approve & Mark Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ListBooking