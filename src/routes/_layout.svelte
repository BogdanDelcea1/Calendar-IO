<!-- src/routes/__layout.svelte or wherever your navigation is defined -->

<script>
    import { goto } from '$app/navigation';
    import { session } from '$app/stores';
  
    async function logout() {
      try {
        const response = await fetch('/api/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        if (response.ok) {
          // Clear the user session on the client side
          session.update(() => ({ user: null }));
  
          // Redirect to the login page or home page
          goto('/login');
        } else {
          console.error('Failed to log out.');
        }
      } catch (error) {
        console.error('Error during logout:', error);
      }
    }
  </script>
  
  <nav>
    <!-- Other navigation items -->
  
    {#if $session.user}
      <button on:click={logout}>Logout</button>
    {/if}
  </nav>
  