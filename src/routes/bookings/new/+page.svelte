<!-- src/routes/bookings/new/+page.svelte -->

<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let bookingData = {
    title: '',
    description: '',
    duration: '',
    platform: '',
    startTime: '',
    endTime: '',
    participantIds: [],
  };

  let users = []; // List of users to select as participants
  let error = '';

  async function submitBooking() {
    try {
      // Log the current bookingData
      console.log('Booking Data:', bookingData);

      // Validate that all required fields are filled
      if (
        !bookingData.title ||
        !bookingData.duration ||
        !bookingData.platform ||
        !bookingData.startTime ||
        !bookingData.endTime ||
        bookingData.participantIds.length === 0
      ) {
        error = 'Please fill all required fields.';
        console.log('Validation Error:', error);
        return;
      }

      // Parse duration to integer
      bookingData.duration = parseInt(bookingData.duration, 10);

      // Convert date/time fields to ISO strings
      bookingData.startTime = new Date(bookingData.startTime).toISOString();
      bookingData.endTime = new Date(bookingData.endTime).toISOString();

      // Log booking data before sending
      console.log('Sending booking data to server:', bookingData);

      const response = await fetch('/api/bookings/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Booking created:', result);
        // Redirect to bookings list or confirmation page
        goto('/bookings/list');
      } else {
        const result = await response.json();
        error = result.error || 'Failed to create booking.';
        console.log('Server Error:', error);
      }
    } catch (err) {
      error = 'An error occurred while creating the booking.';
      console.error('Submission Error:', err);
    }
  }

  async function fetchUsers() {
    try {
      // Fetch the list of users to select participants
      const res = await fetch('/api/users');
      if (res.ok) {
        users = await res.json();
        console.log('Users fetched:', users);
      } else {
        error = 'Failed to fetch users.';
        console.log('Error fetching users:', error);
      }
    } catch (err) {
      error = 'An error occurred while fetching users.';
      console.error('Fetch Users Error:', err);
    }
  }

  onMount(() => {
    fetchUsers();
  });
</script>

<h1>Create a New Booking</h1>

{#if error}
  <p style="color: red;">{error}</p>
{/if}

<form on:submit|preventDefault={submitBooking}>
  <label>
    Title:
    <input type="text" bind:value={bookingData.title} required />
  </label>
  <label>
    Description:
    <textarea bind:value={bookingData.description}></textarea>
  </label>
  <label>
    Duration (minutes):
    <input type="number" bind:value={bookingData.duration} min="1" required />
  </label>
  <label>
    Platform:
    <input type="text" bind:value={bookingData.platform} required />
  </label>
  <label>
    Start Time:
    <input type="datetime-local" bind:value={bookingData.startTime} required />
  </label>
  <label>
    End Time:
    <input type="datetime-local" bind:value={bookingData.endTime} required />
  </label>
  <label>
    Participants:
    <select multiple bind:value={bookingData.participantIds} required>
      {#each users as user}
        <option value={user.id}>{user.username}</option>
      {/each}
    </select>
  </label>
  <button type="submit">Create Booking</button>
</form>

<style>
  label {
    display: block;
    margin-bottom: 1rem;
  }

  input,
  textarea,
  select {
    width: 100%;
    padding: 0.5rem;
  }

  button {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
  }

  textarea {
    height: 100px;
  }
</style>
