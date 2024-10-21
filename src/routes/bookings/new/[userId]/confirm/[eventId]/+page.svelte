<!-- src/routes/bookings/new/[userId]/confirm/[eventId]/+page.svelte -->

<script>
    export let data;
  
    const { creator, bookingDetails, bookingId } = data;
  
    // Extract booking details for display
    let { title, duration, platform, startTime, endTime } = bookingDetails;
  
    // Format dates for better readability
    const formattedStartTime = new Date(startTime).toLocaleString();
    const formattedEndTime = new Date(endTime).toLocaleString();
  
    let error = null; // To store error messages
  </script>
  
  <main>
    {#if creator && bookingDetails}
      <h1>Confirm Booking with {creator.username}</h1>
  
      <!-- Display error message if present -->
      {#if error}
        <p style="color: red;">Error: {error}</p>
      {/if}
  
      <!-- Display booking details -->
      <div>
        <p><strong>Meeting Purpose:</strong> {title}</p>
        <p><strong>Duration:</strong> {duration} minutes</p>
        <p><strong>Platform:</strong> {platform}</p>
        <p><strong>Time:</strong> {formattedStartTime} - {formattedEndTime}</p>
      </div>
  
      <!-- Confirmation Form -->
      <form method="POST">
        <button type="submit">Confirm Booking</button>
      </form>
    {:else}
      <p style="color: red;">
        User or creator data not found. Unable to create a booking.
      </p>
    {/if}
  </main>
  
  <style>
    main {
      padding: 2rem;
      max-width: 600px;
      margin: 0 auto;
    }
  
    div p {
      margin-bottom: 0.5rem;
    }
  
    form {
      margin-top: 2rem;
      text-align: center;
    }
  
    button {
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
    }
  
    p {
      font-size: 1.1rem;
    }
  </style>
  