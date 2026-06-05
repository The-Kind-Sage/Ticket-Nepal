import React, { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Ticket, CreditCard, CheckCircle2, Calendar, Armchair, Download, Loader2, Undo2, X, Film } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import Loading from "../components/Loading";
import BlurCircle from "../components/BlurCircle";
import timeFormat from "../lib/timeFormat";
import { dateFormat } from "../lib/dateFormate";

const MyBooking = () => {
  const currency = import.meta.env.VITE_CURRENCY;
  const { axios, getToken, user, image_base_url } = useAppContext();

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  // --- NEW REFUND STATES ---
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [refundData, setRefundData] = useState({ phone: "", reason: "", email: "" });
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);

  // --- IMAGE HELPER ---
  const getImageUrl = (path) => {
    if (!path) return "/placeholder.jpg";
    if (path.includes('uploads') || !path.startsWith('/')) {
      const cleanPath = path.replace(/\\/g, '/').replace(/^\//, "");
      const base = image_base_url?.replace(/\/$/, "");
      return `${base}/${cleanPath}`;
    }
    return `https://image.tmdb.org/t/p/w500${path}`;
  };

  const getMyBookings = async () => {
    try {
      const { data } = await axios.get("/api/users/bookings", {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });
      if (data.success) setBookings(data.bookings || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
        getMyBookings();
        setRefundData(prev => ({ ...prev, email: user.email }));
    }
  }, [user]);

  // --- NEW REFUND HELPER ---
  const canRequestRefund = (showDateTime) => {
    const movieTime = new Date(showDateTime);
    const now = new Date();
    const diffInMs = movieTime - now;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    // Refund allowed if show is MORE than 2 hours away
    return diffInHours > 2;
  };

  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingRefund(true);
    try {
      const { data } = await axios.post("/api/users/refund-request", {
        bookingId: selectedBooking._id,
        ...refundData
      }, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });

      if (data.success) {
        alert("Refund request submitted successfully!");
        setShowRefundModal(false);
        getMyBookings(); // Refresh to hide button
      }
    } catch (error) {
      alert(error.response?.data?.message || "Refund request failed.");
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  // --- ESEWA PAYMENT LOGIC ---
  const handleEsewaPay = async (bookingId) => {
    try {
      if (!bookingId) return;
      const { data } = await axios.post(
        "/api/payment/esewa/init",
        { bookingId },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (!data.success) {
        alert(data.message || "Esewa init failed");
        return;
      }

      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.payment_url;
      form.acceptCharset = "UTF-8";

      Object.keys(data.formData).forEach((key) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = data.formData[key];
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      alert("Payment initialization failed");
    }
  };

  // --- PDF GENERATION LOGIC ---
  const handleDownloadTicket = async (bookingId) => {
    setDownloadingId(bookingId);
    const element = document.getElementById(`printable-ticket-${bookingId}`);
    
    try {
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: "#ffffff",
        logging: false 
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 10, pdfWidth, pdfHeight);
      pdf.save(`Ticket-${bookingId.slice(-6)}.pdf`);
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("Failed to generate PDF.");
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="relative px-6 md:px-16 lg:px-40 pt-28 pb-20 min-h-screen bg-[#050505]">
      <BlurCircle top="50px" left="-50px" />
      <BlurCircle bottom="50px" right="-50px" />

      <div className="max-w-4xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
            <Ticket className="text-primary" size={32} />
            My <span className="text-primary">Tickets</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage your bookings and download your entry passes.</p>
        </header>

        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/5 border border-dashed border-white/10 rounded-3xl">
            <Ticket size={48} className="text-gray-700 mb-4" />
            <p className="text-gray-400">No bookings found.</p>
          </div>
        ) : (
          <div className="grid gap-8">
            {bookings.map((item, index) => {
              const bookedSeats = item.seats || [];
              const movie = item.show?.Movie || {};
              const showTime = item.show?.showDateTime || item.show?.showTime;

              return (
                <div key={index} className="relative flex flex-col md:flex-row bg-[#111] border border-white/5 rounded-3xl overflow-hidden group hover:border-primary/30 transition-all duration-500 shadow-2xl">
                  
                  {/* Poster */}
                  <div className="md:w-56 h-48 md:h-auto relative overflow-hidden">
                    <img src={getImageUrl(movie.poster_path)} alt={movie.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    {!item.isPaid && (
                      <div className="absolute top-3 left-3 bg-yellow-500 text-black text-[10px] font-black px-2 py-1 rounded uppercase tracking-tighter">
                        Pending
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors">{movie.title}</h2>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-400 mt-3 font-medium">
                        <span className="flex items-center gap-1"><Calendar size={14} className="text-primary" /> {showTime ? dateFormat(showTime) : "N/A"}</span>
                        <span className="flex items-center gap-1"><Ticket size={14} className="text-primary" /> {movie.runtime ? timeFormat(movie.runtime) : "N/A"}</span>
                      </div>

                      {/* GENRES DISPLAY */}
                      {item.genres && item.genres.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {item.genres.map((genre, gIdx) => {
                            const genreName = typeof genre === 'string' ? genre : genre.name || genre.id;
                            return (
                              <span key={gIdx} className="flex items-center gap-1.5 bg-primary/10 text-primary/80 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-primary/20">
                                <Film size={10} /> {genreName}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    {/* NEW: REFUND OPTION BUTTON */}
                    {item.isPaid && !item.refundRequested && canRequestRefund(showTime) && (
                        <button 
                            onClick={() => { setSelectedBooking(item); setShowRefundModal(true); }}
                            className="mt-4 flex items-center gap-2 text-yellow-500 text-xs font-bold hover:text-yellow-400 transition-colors w-fit"
                        >
                            <Undo2 size={14} /> Request Refund
                        </button>
                    )}

                    {item.refundRequested && (
                        <p className="mt-4 text-orange-500 text-xs font-bold">Refund Requested</p>
                    )}

                    <div className="mt-6 flex items-center gap-4">
                      <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Seats</p>
                        <p className="text-sm font-bold text-primary flex items-center gap-2"><Armchair size={14} /> {bookedSeats.join(", ")}</p>
                      </div>
                    </div>
                  </div>

                  {/* Price & Actions */}
                  <div className="md:w-48 bg-white/[0.02] border-l border-dashed border-white/10 p-6 flex flex-col items-center justify-center text-center relative">
                    <div className="hidden md:block absolute -top-3 -left-3 w-6 h-6 bg-[#050505] rounded-full border border-white/5"></div>
                    <div className="hidden md:block absolute -bottom-3 -left-3 w-6 h-6 bg-[#050505] rounded-full border border-white/5"></div>

                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Amount</p>
                    <p className="text-2xl font-black text-white mb-4">{currency}{item.amount}</p>

                    {item.isPaid ? (
                      <button 
                        onClick={() => handleDownloadTicket(item._id)}
                        disabled={downloadingId === item._id}
                        className="w-full bg-white text-black py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95"
                      >
                        {downloadingId === item._id ? <Loader2 className="animate-spin" size={16}/> : <Download size={16}/>}
                        {downloadingId === item._id ? "..." : "Ticket"}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEsewaPay(item._id)}
                        className="w-full bg-primary hover:bg-red-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                      >
                        <CreditCard size={16} /> Pay Now
                      </button>
                    )}
                  </div>

                  {/* --- HIDDEN PRINTABLE AREA --- */}
                  {item.isPaid && (
                    <div style={{ position: "absolute", left: "-9999px", top: "0" }}>
                      <div id={`printable-ticket-${item._id}`} style={{ backgroundColor: "#ffffff", color: "#000000", width: "550px", padding: "40px", fontFamily: "Arial, sans-serif" }}>
                        <div style={{ border: "3px solid #000000", padding: "30px", borderRadius: "15px" }}>
                          <h1 style={{ fontSize: "28px", fontWeight: "900", textAlign: "center", textTransform: "uppercase", margin: "0" }}>{movie.title}</h1>
                          <p style={{ textAlign: "center", color: "#666", fontSize: "12px", marginBottom: "20px" }}>OFFICIAL E-TICKET</p>
                          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed #ccc", borderBottom: "1px dashed #ccc", padding: "15px 0", marginBottom: "30px" }}>
                            <div>
                              <p style={{ fontSize: "10px", color: "#888", margin: "0" }}>DATE & TIME</p>
                              <p style={{ fontWeight: "bold", margin: "0" }}>{showTime ? dateFormat(showTime) : "N/A"}</p>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <p style={{ fontSize: "10px", color: "#888", margin: "0" }}>BOOKING ID</p>
                              <p style={{ fontWeight: "bold", margin: "0" }}>#{item._id.slice(-8).toUpperCase()}</p>
                            </div>
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "25px" }}>
                            {bookedSeats.map(seat => (
                              <div key={seat} style={{ textAlign: "center", padding: "10px", border: "1px solid #eee", borderRadius: "10px" }}>
                                <p style={{ fontSize: "10px", fontWeight: "bold" }}>SEAT {seat}</p>
                                <QRCodeSVG value={`VERIFY-${item._id}-${seat}`} size={100} level="H" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- NEW REFUND FORM MODAL --- */}
      {showRefundModal && (
          <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="bg-[#111] border border-white/10 w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
                  <button onClick={() => setShowRefundModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                      <X size={24} />
                  </button>
                  <h2 className="text-2xl font-black text-white uppercase mb-2">Refund Request</h2>
                  <p className="text-gray-500 text-sm mb-6">Please provide details to process your refund for <span className="text-primary font-bold">{selectedBooking?.show?.Movie?.title}</span>.</p>

                  <form onSubmit={handleRefundSubmit} className="space-y-4">
                      <div>
                          <label className="text-[10px] text-gray-500 uppercase font-black mb-1 block">Email (Gmail)</label>
                          <input 
                            required 
                            type="email" 
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                            value={refundData.email}
                            onChange={(e) => setRefundData({...refundData, email: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="text-[10px] text-gray-500 uppercase font-black mb-1 block">Phone Number (eSewa/Khalti)</label>
                          <input 
                            required 
                            type="text" 
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                            placeholder="98XXXXXXXX"
                            value={refundData.phone}
                            onChange={(e) => setRefundData({...refundData, phone: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="text-[10px] text-gray-500 uppercase font-black mb-1 block">Region / Reason</label>
                          <textarea 
                            required 
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none h-24 resize-none"
                            placeholder="Why are you requesting a refund?"
                            value={refundData.reason}
                            onChange={(e) => setRefundData({...refundData, reason: e.target.value})}
                          />
                      </div>
                      <button 
                        type="submit" 
                        disabled={isSubmittingRefund}
                        className="w-full bg-primary py-4 rounded-xl text-white font-black uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50"
                      >
                          {isSubmittingRefund ? "Submitting..." : "Submit Refund Request"}
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default MyBooking;