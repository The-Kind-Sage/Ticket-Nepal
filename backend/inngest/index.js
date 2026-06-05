import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";

// Create Inngest client
export const inngest = new Inngest({ id: "my-app" });


// CREATE / SYNC USER
const syncUserData = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data;

    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: `${first_name} ${last_name}`,
      image: image_url,
    };

    await User.findByIdAndUpdate(
      id,
      userData,
      { upsert: true, new: true }
    );
  }
);


// DELETE USER
const deleteUserData = inngest.createFunction(
  { id: "delete-user-from-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    const { id } = event.data;
    await User.findByIdAndDelete(id);
  }
);


// UPDATE USER
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data;

    const userData = {
      email: email_addresses[0].email_address,
      name: `${first_name} ${last_name}`,
      image: image_url,
    };

    await User.findByIdAndUpdate(
      id,
      userData,
      { new: true }
    );
  }
);


// Inngest function to cancel booking and release seats of show after 10 minutes of booking creaed if payment is not made 

const releaseSeatAndDeletBooking = inngest.createFunction(
  {id:'release-seats-delete-booking'},
  {event:"app/checkpayment"},
  async ({ event, step})=>{
      const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);
      await step.sleepUntil('wait-for-10-minutes', tenMinutesLater);

      await step.run('check-payment-status', async ()=>{
        const bookingId = event.data.bookingId;
        const booking = await Booking.findById(bookingId)

        // If payment is not made, realease seats and booking  delet
        if(!booking.isPaid){
          const show = await Show.findById(booking.show);
          booking.bookedSeats.forEach((seat)=>{
            delete show.occupiedSeats[seat]
          });
          show.markModified('occupiedSeats')
          await show.save()
          await Booking.findByIdAndDelete(booking_id)
        }
      })

  }
)


// Export functions
export const functions = [
  syncUserData,
  deleteUserData,
  syncUserUpdation,
  releaseSeatAndDeletBooking,
];