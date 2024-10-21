<script>
    import { onMount } from 'svelte';
  
    let notifications = [];
    let error = '';
  
    onMount(async () => {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          notifications = await res.json();
        } else {
          const result = await res.json();
          error = result.error;
        }
      } catch (err) {
        error = 'An error occurred while fetching notifications.';
      }
    });
  </script>
  
  {#if error}
  <p style="color: red;">{error}</p>
  {/if}
  
  <h2>Your Notifications</h2>
  
  <ul>
    {#each notifications as notification}
      <li>
        <p>{notification.message}</p>
        <small>{new Date(notification.createdAt).toLocaleString()}</small>
      </li>
    {/each}
  </ul>
  