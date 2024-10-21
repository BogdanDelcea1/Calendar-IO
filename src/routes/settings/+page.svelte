<script>
    import { onMount } from 'svelte';
  
    let receiveEmails = true;
    let error = '';
    let success = '';
  
    onMount(async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const settings = await res.json();
          receiveEmails = settings.receiveEmails;
        } else {
          const result = await res.json();
          error = result.error;
        }
      } catch (err) {
        error = 'An error occurred while fetching settings.';
      }
    });
  
    async function saveSettings() {
      error = '';
      success = '';
  
      try {
        const res = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ receiveEmails })
        });
  
        const result = await res.json();
  
        if (res.ok) {
          success = result.message;
        } else {
          error = result.error;
        }
      } catch (err) {
        error = 'An error occurred while saving settings.';
      }
    }
  </script>
  
  <h1>Account Settings</h1>
  
  {#if error}
  <p style="color: red;">{error}</p>
  {/if}
  
  {#if success}
  <p style="color: green;">{success}</p>
  {/if}
  
  <form on:submit|preventDefault={saveSettings}>
    <label>
      <input type="checkbox" bind:checked={receiveEmails} />
      Receive Email Notifications
    </label>
    <br />
    <button type="submit">Save Changes</button>
  </form>
  