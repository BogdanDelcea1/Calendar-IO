<!-- src/components/LogoutButton.svelte -->

<script>
    import { goto } from '$app/navigation';
  
    async function logout() {
      try {
        const response = await fetch('/api/logout', {
          method: 'POST',
        });
  
        if (response.ok) {
          // Redirect to the login page
          goto('/login');
        } else {
          console.error('Failed to log out.');
        }
      } catch (error) {
        console.error('Error during logout:', error);
      }
    }
  </script>
  
  <button on:click={logout}>Logout</button>
  