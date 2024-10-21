<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
  
    let userId = $page.params.userId;
    let targetUser = null;
    let bookingDetails = null;
    let availableSlots = [];
    let error = '';
  
    onMount(async () => {
      // Retrieve booking details
      const details = sessionStorage.getItem('bookingDetails');
      if (details) {
        bookingDetails = JSON.parse(details);
      } else {
        error = 'Booking details not found.';
        return;
      }
  
      // Fetch target user's availability
      const res = await fetch(`/api/bookings/availability?userId=${userId}&duration=${bookingDetails.duration}`);
      if (res.ok) {
        availableSlots = await res.json();
      } else {
        const result = await res.json();
        error = result.error;
      }
    });
  
    async function selectSlot(slot) {
      // Proceed to booking confirmation
      sessionStorage.setItem('selectedSlot', JSON.stringify(slot));
      goto(`/bookings/new/${userId}/confirm`);
    }
  </script>
  
  {#if error}
  <p style="color: red;">{error}</p>
  {/if}
  
  <h1>Select a Time Slot</h1>
  
  {#if availableSlots.length > 0}
  <ul>
    {#each availableSlots as slot}
      <li>
        <button on:click={() => selectSlot(slot)}>
          {new Date(slot.startTime).toLocaleString()} - {new Date(slot.endTime).toLocaleString()}
        </button>
      </li>
    {/each}
  </ul>
  {:else}
  <p>No available slots found.</p>
  {/if}
  