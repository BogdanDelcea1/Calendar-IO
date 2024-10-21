<!-- src/routes/+page.svelte -->

<script>
    export let data; // Receives data from the load function
  
    // Destructure the user from data
    let { user } = data;
  </script>
  
  <main>
    {#if user}
      <h1>Welcome, {user.username}!</h1>
      <p>Email: {user.email}</p>
      <!-- Add more user-related information as needed -->
    {:else}
      <h1>Welcome to Our Booking App!</h1>
      <p>Please <a href="/login">login</a> to continue.</p>
    {/if}
  </main>
  
  <style>
    main {
      padding: 2rem;
      text-align: center;
    }
  </style>
  