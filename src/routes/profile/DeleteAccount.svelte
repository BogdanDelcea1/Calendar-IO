<script>
    import { goto } from '$app/navigation';
  
    let password = '';
    let error = '';
    let success = '';
  
    async function deleteAccount() {
      error = '';
      success = '';
  
      const confirmDelete = confirm(
        'Are you sure you want to permanently delete your account? This action cannot be undone.'
      );
  
      if (!confirmDelete) {
        return;
      }
  
      try {
        const res = await fetch('/api/delete-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });
  
        const result = await res.json();
  
        if (res.ok) {
          success = result.message || 'Your account has been deleted.';
          // Redirect to home page after a short delay
          setTimeout(() => {
            goto('/');
          }, 2000);
        } else {
          error = result.error || 'Failed to delete account.';
        }
      } catch (err) {
        console.error(err);
        error = 'An error occurred while deleting the account.';
      }
    }
  </script>
  
  <h2>Delete Account</h2>
  
  {#if error}
  <p style="color: red;">{error}</p>
  {/if}
  
  {#if success}
  <p style="color: green;">{success}</p>
  {/if}
  
  <form on:submit|preventDefault={deleteAccount}>
    <label>
      Confirm Password:
      <input type="password" bind:value={password} required />
    </label>
    <br />
    <button type="submit">Delete Account</button>
  </form>
  
  <style>
    h2 {
      color: #ff0000;
    }
  
    label {
      display: block;
      margin-bottom: 1rem;
    }
  
    input[type='password'] {
      width: 100%;
      padding: 0.5rem;
      margin-top: 0.5rem;
    }
  
    button {
      background-color: #ff0000;
      color: white;
      padding: 0.5rem 1rem;
      border: none;
      cursor: pointer;
    }
  
    button:hover {
      background-color: #cc0000;
    }
  </style>
  