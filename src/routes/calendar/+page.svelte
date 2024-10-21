<!-- src/routes/calendar/+page.svelte -->

<script>
  import { goto } from '$app/navigation';
  export let data;

  let bookings = data.bookings || [];
  let user = data.user; // Assuming `user` is included in the data

  // Function to navigate to the edit booking page
  function editBooking(bookingId) {
    goto(`/bookings/edit/${bookingId}`);
  }

  // Function to format dates for display
  function formatDate(dateString) {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }
</script>

<main>
  <h1>Your Calendar</h1>

  {#if bookings.length > 0}
    <ul>
      {#each bookings as booking}
        <li>
          <h2>{booking.event.title}</h2>
          <p><strong>Duration:</strong> {booking.event.duration} minutes</p>
          <p><strong>Platform:</strong> {booking.event.platform}</p>
          <p><strong>Time:</strong> {formatDate(booking.event.startTime)} - {formatDate(booking.event.endTime)}</p>
          <p><strong>Organizer:</strong> {booking.organizer.username}</p>

          <!-- Allow both organizer and participants to edit the confirmed booking -->
          {#if booking.organizerId === user.id || booking.participants.some(p => p.userId === user.id)}
            <button on:click={() => editBooking(booking.id)}>Edit</button>
          {/if}
        </li>
      {/each}
    </ul>
  {:else}
    <p>No confirmed bookings found.</p>
  {/if}
</main>

<style>
  main {
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
  }

  ul {
    list-style-type: none;
    padding: 0;
  }

  li {
    border: 1px solid #ccc;
    padding: 1rem;
    margin-bottom: 1rem;
    border-radius: 5px;
  }

  h2 {
    margin-top: 0;
  }

  p {
    margin: 0.5rem 0;
  }

  button {
    margin-top: 0.5rem;
    padding: 0.5rem 1rem;
    cursor: pointer;
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 3px;
  }

  button:hover {
    background-color: #45a049;
  }
</style>
