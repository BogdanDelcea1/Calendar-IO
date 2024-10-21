<!-- src/routes/bookings/success/+page.svelte -->

<script>
  import { goto } from '$app/navigation';
</script>

<main>
  <h1>Booking Confirmed!</h1>
  <p>Your booking has been successfully confirmed.</p>
  <button on:click={() => goto('/calendar')}>Go to Calendar</button>
</main>

<style>
  main {
    padding: 2rem;
    text-align: center;
  }

  button {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    margin-top: 1rem;
  }

  h1 {
    color: #2ecc71;
  }
</style>
