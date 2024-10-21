<!-- src/routes/bookings/new/[userId]/confirm/+page.svelte -->

<script>
  import { goto } from '$app/navigation';
  export let data;

  let { title, duration, platform, startTime, endTime, userId } = data.bookingDetails;
  let error = '';

  async function confirmBooking(event) {
      event.preventDefault();

      // Ensure all fields are available before sending the request
      if (!title || !duration || !platform || !startTime || !endTime || !userId) {
          error = 'All fields are required.';
          console.error('Error:', error);
          return;
      }

      // Prepare booking data to be sent to the server
      const bookingData = {
          title,
          duration: parseInt(duration, 10),
          platform,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          userId
      };

      try {
          const response = await fetch('/api/bookings/confirm', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(bookingData)
          });

          const result = await response.json();

          if (response.ok) {
              // Redirect to success or calendar page
              goto('/calendar');
          } else {
              error = result.error || 'An error occurred during booking confirmation.';
              console.error('Booking Confirmation Error:', error);
          }
      } catch (err) {
          error = 'An unexpected error occurred.';
          console.error('Fetch Error:', err);
      }
  }
</script>

<main>
  <h1>Confirm Your Booking</h1>

  <!-- Display error message if present -->
  {#if error}
      <p style="color: red;">{error}</p>
  {/if}

  <!-- Booking Information -->
  <div>
      <p><strong>Title:</strong> {title}</p>
      <p><strong>Duration:</strong> {duration} minutes</p>
      <p><strong>Platform:</strong> {platform}</p>
      <p><strong>Start Time:</strong> {new Date(startTime).toLocaleString()}</p>
      <p><strong>End Time:</strong> {new Date(endTime).toLocaleString()}</p>
  </div>

  <!-- Confirmation Button -->
  <form on:submit|preventDefault={confirmBooking}>
      <button type="submit">Confirm Booking</button>
  </form>
</main>

<style>
  main {
      padding: 2rem;
      max-width: 600px;
      margin: 0 auto;
  }

  p {
      margin-bottom: 0.5rem;
  }

  button {
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
  }

  p {
      font-size: 1.1rem;
  }
</style>
