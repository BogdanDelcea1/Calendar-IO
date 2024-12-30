<!-- src/routes/bookings/[bookingId]/confirm/+page.svelte -->

<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { get } from 'svelte/store';
  
    // Props passed from the server-side load function
    export let data;
  
    let booking = data.booking;
    let error = '';
    let successMessage = '';
    let isSubmitting = false;
  
    /**
     * Sends a confirmation response to the server.
     * @param {string} userResponse - The user's response ('CONFIRMED' or 'DECLINED').
     */
    async function sendResponse(userResponse) {
      if (isSubmitting) return; // Prevent multiple submissions
      isSubmitting = true;
      error = '';
      successMessage = '';
  
      try {
        console.log(`Sending response: ${userResponse} for Booking ID: ${booking.id}`);
  
        const payload = { response: userResponse };
  
        const response = await fetch(`/api/bookings/${booking.id}/confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
  
        // Log the raw response for debugging
        const rawResponse = await response.text();
        console.log('Raw Response:', rawResponse);
  
        // Attempt to parse the JSON response
        let result;
        try {
          result = JSON.parse(rawResponse);
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError);
          throw new Error('Invalid JSON response from server.');
        }
  
        if (response.ok) {
          successMessage = result.message || 'Your response has been recorded.';
          console.log('Success:', successMessage);
  
          setTimeout(() => {
            goto('/bookings/list'); 
          }, 2000); // Redirect after 2 seconds
        } else {
          error = result.error || 'Failed to record your response.';
          console.error('Server Error:', error);
        }
      } catch (err) {
        error = err.message || 'An unexpected error occurred.';
        console.error('Submission Error:', err);
      } finally {
        isSubmitting = false;
      }
    }
  </script>
  
  <main>
    <h1>Confirm Your Participation</h1>
  
    {#if booking}
      <section>
        <h2>{booking.event.title}</h2>
        <p><strong>Description:</strong> {booking.event.description || 'No description provided.'}</p>
        <p><strong>Platform:</strong> {booking.event.platform}</p>
        <p><strong>Start Time:</strong> {new Date(booking.event.startTime).toLocaleString()}</p>
        <p><strong>End Time:</strong> {new Date(booking.event.endTime).toLocaleString()}</p>
        <p><strong>Organizer:</strong> {booking.organizer.username} ({booking.organizer.email})</p>
      </section>
  
      <section>
        <h3>Your Response</h3>
        {#if successMessage}
          <p style="color: green;">{successMessage}</p>
        {/if}
        {#if error}
          <p style="color: red;">{error}</p>
        {/if}
        <button on:click={() => sendResponse('CONFIRMED')} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Confirm Participation'}
        </button>
        <button on:click={() => sendResponse('DECLINED')} disabled={isSubmitting} style="margin-left: 1rem; background-color: #f44336;">
          {isSubmitting ? 'Submitting...' : 'Decline'}
        </button>
      </section>
    {:else}
      <p>Loading booking details...</p>
    {/if}
  </main>
  
  <style>
    main {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
      font-family: Arial, sans-serif;
    }
  
    h1 {
      text-align: center;
      margin-bottom: 2rem;
    }
  
    section {
      margin-bottom: 2rem;
    }
  
    button {
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      color: white;
      background-color: #4caf50;
    }
  
    button:hover {
      background-color: #45a049;
    }
  
    button:disabled {
      background-color: #a5d6a7;
      cursor: not-allowed;
    }
  
    button[style*="background-color: #f44336"] {
      background-color: #f44336;
    }
  
    button[style*="background-color: #f44336"]:hover {
      background-color: #d32f2f;
    }
  
    p {
      margin: 1rem 0;
    }
  
    strong {
      font-weight: bold;
    }
  </style>
  