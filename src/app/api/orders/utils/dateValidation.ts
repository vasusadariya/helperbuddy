// The business operates in India, but serverless functions may run in any
// container timezone (Vercel defaults to UTC). Business-hours checks must be
// done in IST regardless of the server's local timezone, or bookings made in
// the client's IST-local morning get converted to UTC and rejected here.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export const validateServerDateTime = (
    dateTimeString: string,
    timeString: string
  ): { isValid: boolean; error?: string } => {
    try {
      // Parse the incoming ISO date string
      console.log("Date:", timeString);
      const selectedDateTime = new Date(dateTimeString);
      const now = new Date();

      // Check if the date and time are valid
      if (isNaN(selectedDateTime.getTime())) {
        return { isValid: false, error: "Please enter a valid date and time" };
      }

      // Check if the date is in the past
      if (selectedDateTime < now) {
        const isToday = selectedDateTime.toDateString() === now.toDateString();
        return {
          isValid: false,
          error: isToday
            ? "Please select a future time for today's bookings"
            : "Please select a future date",
        };
      }

      // Check service hours (8 AM to 8 PM IST) using the IST wall-clock hour,
      // independent of the server container's local timezone.
      const istDateTime = new Date(selectedDateTime.getTime() + IST_OFFSET_MS);
      const hour = istDateTime.getUTCHours();
      if (hour < 8 || hour >= 20) {
        return {
          isValid: false,
          error: "Our service hours are between 8:00 AM and 8:00 PM",
        };
      }
  
      // Check if the date is too far in the future (more than 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      if (selectedDateTime > thirtyDaysFromNow) {
        return {
          isValid: false,
          error: "Bookings can only be made up to 30 days in advance",
        };
      }
  
      return { isValid: true };
    } catch (error) {
      console.error("Error validating date and time:", error);
      return {
        isValid: false,
        error: `${error}`,
      };
    }
  };