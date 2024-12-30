<!-- src/routes/bookings/edit/[bookingId]/+page.svelte -->

<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    export let data;
    export let form;

    let booking = data.booking;
    let users = [];
    let error = '';
    let successMessage = '';
    let isSubmitting = false; // Flag to prevent multiple submissions

    // Initialize form fields only if booking and event are available
    let title = '';
    let description = '';
    let duration = 60; // Default to 60 minutes
    let platform = '';
    let startTime = '';
    let endTime = '';
    let participantIds = [];

    // Fetch all users except the organizer to select new participants
    async function fetchUsers() {
      try {
        const response = await fetch('/api/users');
        const result = await response.json();
        if (response.ok) {
          // Exclude the organizer from the participants list
          users = result.users.filter(user => user.id !== booking.organizer.id);
        } else {
          error = result.error || 'Failed to fetch users';
        }
      } catch (err) {
        error = 'An unexpected error occurred while fetching users';
        console.error(err);
      }
    }

    // Helper function to format Date objects to 'YYYY-MM-DDTHH:MM' for input[type="datetime-local"]
    function formatDateTimeLocal(dateTime) {
      const dt = new Date(dateTime);
      const offset = dt.getTimezoneOffset();
      const localDate = new Date(dt.getTime() - offset * 60000);
      return localDate.toISOString().slice(0, 16);
    }

    // Helper function to convert 'YYYY-MM-DDTHH:MM' back to ISO string
    function parseDateTimeLocal(dateTimeLocal) {
      const localDate = new Date(dateTimeLocal);
      const offset = localDate.getTimezoneOffset();
      const utcDate = new Date(localDate.getTime() + offset * 60000);
      return utcDate.toISOString();
    }

    onMount(() => {
      if (booking && booking.event) {
        title = booking.event.title || '';
        description = booking.event.description || '';
        duration = booking.event.duration || 60;
        platform = booking.event.platform || '';
        startTime = booking.event.startTime
          ? formatDateTimeLocal(booking.event.startTime)
          : '';
        endTime = booking.event.endTime
          ? formatDateTimeLocal(booking.event.endTime)
          : '';
        participantIds = booking.participants.map(p => p.userId) || [];
      }
      fetchUsers();
    });

    // Function to handle form submission
    async function handleSubmit(event) {
      event.preventDefault(); // Prevent default form submission
      if (isSubmitting) return; // Prevent if already submitting
      isSubmitting = true;
      error = '';
      successMessage = '';

      // Validate form data before sending
      if (!title.trim()) {
        error = 'Title is required.';
        isSubmitting = false;
        return;
      }

      if (!platform.trim()) {
        error = 'Platform is required.';
        isSubmitting = false;
        return;
      }

      if (!startTime || !endTime) {
        error = 'Start Time and End Time are required.';
        isSubmitting = false;
        return;
      }

      if (isNaN(duration) || duration <= 0) {
        error = 'Duration must be a positive number.';
        isSubmitting = false;
        return;
      }

      try {
        const payload = {
          title,
          description,
          duration: Number(duration),
          platform,
          startTime: parseDateTimeLocal(startTime),
          endTime: parseDateTimeLocal(endTime),
          participantIds: Array.from(new Set(participantIds)), // Ensure unique participant IDs
        };

        const response = await fetch(`/api/bookings/${booking.id}/update`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (response.ok) {
          successMessage = 'Booking updated successfully.';
          // Redirect to bookings list after successful update
          goto('/bookings/list');
        } else {
          error = result.error || 'Failed to update booking.';
          console.error('Update Booking Error:', error);
        }
      } catch (err) {
        error = 'An unexpected error occurred while updating the booking.';
        console.error('Update Booking Fetch Error:', err);
      } finally {
        isSubmitting = false;
      }
    }

    // Function to handle booking deletion
    async function deleteBooking() {
      const confirmDeletion = confirm('Are you sure you want to delete this booking? This action cannot be undone.');
      if (!confirmDeletion) return;

      try {
        const response = await fetch(`/api/bookings/${booking.id}/delete`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          alert('Booking deleted successfully.');
          goto('/bookings/list'); // Redirect to bookings list after deletion
        } else {
          const result = await response.json();
          error = result.error || 'Failed to delete booking.';
          console.error('Delete Booking Error:', error);
          alert(error); // Notify user of the error
        }
      } catch (err) {
        error = 'An unexpected error occurred while deleting the booking.';
        console.error('Delete Booking Fetch Error:', err);
      }
    }
</script>

<main>
  <h1>Edit Booking</h1>

  {#if booking && booking.event}
    <form on:submit={handleSubmit}>
      <div>
        <label for="title">Title:</label>
        <input id="title" name="title" type="text" bind:value={title} required />
      </div>

      <div>
        <label for="description">Description:</label>
        <textarea id="description" name="description" bind:value={description}></textarea>
      </div>

      <div>
        <label for="duration">Duration (minutes):</label>
        <input id="duration" name="duration" type="number" min="1" bind:value={duration} required />
      </div>

      <div>
        <label for="platform">Platform:</label>
        <input id="platform" name="platform" type="text" bind:value={platform} required />
      </div>

      <div>
        <label for="startTime">Start Time:</label>
        <input
          id="startTime"
          name="startTime"
          type="datetime-local"
          bind:value={startTime}
          required
        />
      </div>

      <div>
        <label for="endTime">End Time:</label>
        <input
          id="endTime"
          name="endTime"
          type="datetime-local"
          bind:value={endTime}
          required
        />
      </div>

      <div>
        <label for="participants">Participants:</label>
        <select id="participants" name="participantIds" multiple bind:value={participantIds} required>
          {#each users as user}
            <option value={user.id}>
              {user.username} ({user.email})
            </option>
          {/each}
        </select>
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Save Changes'}
      </button>
    </form>

    <button on:click={deleteBooking} style="background-color: #f44336; margin-top: 1rem;">
      Delete Booking
    </button>

    {#if error}
      <p style="color: red;">{error}</p>
    {/if}

    {#if successMessage}
      <p style="color: green;">{successMessage}</p>
    {/if}
  {:else}
    <p>Loading booking details...</p>
  {/if}
</main>

<style>
  main {
    padding: 2rem;
    max-width: 600px;
    margin: 0 auto;
  }

  form div {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
  }

  input,
  textarea,
  select {
    width: 100%;
    padding: 0.5rem;
    box-sizing: border-box;
  }

  button {
    padding: 0.75rem 1.5rem;
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
  }

  button:hover {
    background-color: #45a049;
  }

  button[style*="background-color: #f44336"] {
    background-color: #f44336;
  }

  button[style*="background-color: #f44336"]:hover {
    background-color: #da190b;
  }

  p {
    margin-top: 1rem;
  }
</style>
