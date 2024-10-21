<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  let bookings = [];
  let user = $page.data.user;
  let error = '';
  let successMessage = '';

  // Fetch all pending bookings relevant to the user
  async function fetchBookings() {
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        bookings = await res.json();
      } else {
        const result = await res.json();
        error = result.error || 'Failed to fetch bookings.';
      }
    } catch (err) {
      error = 'An error occurred while fetching bookings.';
      console.error(err);
    }
  }

  /**
   * Handles booking confirmation or rejection.
   * @param {number} bookingId - The ID of the booking.
   * @param {string} response - The response ('CONFIRMED' or 'DECLINED').
   */
  async function respondToBooking(bookingId, response) {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      });

      const result = await res.json();

      if (res.ok) {
        successMessage = result.message || 'Your response has been recorded.';
        console.log('Success:', successMessage);
        // Fetch all bookings again after the response to ensure updated list
        await fetchBookings();
      } else {
        error = result.error || 'Failed to respond to booking.';
        console.error('Server Error:', error);
      }
    } catch (err) {
      error = 'An unexpected error occurred.';
      console.error('Response Error:', err);
    }
  }

  /**
   * Deletes a booking.
   * @param {number} bookingId - The ID of the booking.
   */
  async function deleteBooking(bookingId) {
    const confirmDelete = confirm('Are you sure you want to delete this booking?');
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        // Remove the deleted booking from the list
        bookings = bookings.filter((booking) => booking.id !== bookingId);
        successMessage = 'Booking deleted successfully.';
      } else {
        const result = await res.json();
        alert(result.error || 'Failed to delete booking.');
      }
    } catch (err) {
      console.error('Error deleting booking:', err);
    }
  }

  onMount(async () => {
    await fetchBookings(); // Fetch bookings when the page is mounted
  });
</script>

<main>
  <h1>Pending Bookings</h1>

  {#if error}
    <p style="color: red;">{error}</p>
  {/if}

  {#if successMessage}
    <p style="color: green;">{successMessage}</p>
  {/if}

  <!-- Ensure bookings are fetched before rendering the list -->
  {#if bookings.length > 0}
    <ul>
      {#each bookings as booking}
        {#if booking.status === 'PENDING'} <!-- Only show pending bookings -->
          <li>
            <p><strong>Title:</strong> {booking.event.title}</p>
            <p><strong>Platform:</strong> {booking.event.platform}</p>
            <p><strong>Time:</strong> {new Date(booking.event.startTime).toLocaleString()} - {new Date(booking.event.endTime).toLocaleString()}</p>
            <p><strong>Status:</strong> {booking.status}</p>

            <!-- If the current user is the organizer, allow them to edit or delete the booking -->
            {#if booking.organizerId === user.id}
              <button on:click={() => goto(`/bookings/edit/${booking.id}`)}>Edit</button>
            {/if}

            <!-- If the current user is a participant and hasn't responded yet, allow confirm/decline -->
            {#if booking.organizerId !== user.id && booking.participants.some(p => p.userId === user.id && p.response === 'PENDING')}
              <button on:click={() => respondToBooking(booking.id, 'CONFIRMED')}>Confirm</button>
              <button on:click={() => respondToBooking(booking.id, 'DECLINED')} style="background-color: #f44336;">Decline</button>
            {/if}
          </li>
        {/if}
      {/each}
    </ul>
  {:else}
    <p>No pending bookings available.</p>
  {/if}
</main>

<style>
  ul {
    list-style: none;
    padding: 0;
  }

  li {
    border: 1px solid #ccc;
    padding: 1rem;
    margin-bottom: 1rem;
    border-radius: 5px;
  }

  button {
    margin-right: 0.5rem;
    padding: 0.5rem 1rem;
    cursor: pointer;
    border: none;
    border-radius: 3px;
    color: white;
    background-color: #4caf50;
  }

  button:hover {
    background-color: #45a049;
  }

  button[style*="background-color: #f44336"] {
    background-color: #f44336;
  }

  button[style*="background-color: #f44336"]:hover {
    background-color: #d32f2f;
  }

  p {
    margin: 0.5rem 0;
  }

  strong {
    font-weight: bold;
  }
</style>
