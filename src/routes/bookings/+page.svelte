<!-- src/routes/bookings/+page.svelte -->

<script>
    let searchQuery = '';
    let searchResults = [];
    let error = '';
  
    async function searchUsers() {
      error = '';
      try {
        const res = await fetch(
          `/api/users/search?query=${encodeURIComponent(searchQuery.toLowerCase())}`
        );
        if (res.ok) {
          searchResults = await res.json();
        } else {
          const result = await res.json();
          error = result.error || 'An unexpected error occurred.';
        }
      } catch (err) {
        error = 'An error occurred during user search.';
        console.error(err);
      }
    }
  </script>
  
  <main>
    <h1>Start a New Booking</h1>
  
    <input
      type="text"
      bind:value={searchQuery}
      placeholder="Enter username to search"
      on:keydown={(e) => e.key === 'Enter' && searchUsers()}
    />
    <button on:click={searchUsers}>Search Users</button>
  
    {#if error}
      <p style="color: red;">{error}</p>
    {/if}
  
    {#if searchResults.length > 0}
      <h2>Search Results:</h2>
      <ul>
        {#each searchResults as user}
          <li>
            <p><strong>{user.username}</strong></p>
            <a href={`/bookings/new/${user.id}`}>Create Booking</a>
          </li>
        {/each}
      </ul>
    {:else if searchQuery}
      <p>No users found.</p>
    {/if}
  </main>
  
  <style>
    main {
      padding: 2rem;
      max-width: 600px;
      margin: 0 auto;
    }
  
    input {
      width: 70%;
      padding: 0.5rem;
      margin-right: 0.5rem;
    }
  
    button {
      margin-top: 0.75rem;
      padding: 0.5rem 1rem;
      background-color: #4caf50;
      color: rgb(255, 252, 252);
    }
  
    ul {
      list-style: none;
      padding: 0;
    }
  
    li {
      border: 1px solid #ccc;
      padding: 1rem;
      margin-bottom: 1rem;
    }
  
    a {
      color: #1785cf;
      text-decoration: none;
    }
  
    a:hover {
      text-decoration: underline;
    }
  </style>
  