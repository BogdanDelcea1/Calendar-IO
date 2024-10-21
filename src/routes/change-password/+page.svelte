<script>
    let oldPassword = '';
    let newPassword = '';
    let confirmPassword = '';
    let error = '';
    let success = '';
  
    async function changePassword() {
      error = '';
      success = '';
  
      try {
        const res = await fetch('/api/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oldPassword, newPassword, confirmPassword })
        });
  
        const result = await res.json();
  
        if (res.ok) {
          success = result.message;
          oldPassword = '';
          newPassword = '';
          confirmPassword = '';
        } else {
          error = result.error;
        }
      } catch (err) {
        error = 'An error occurred while changing password.';
      }
    }
  </script>
  
  <h1>Change Password</h1>
  
  {#if error}
  <p style="color: red;">{error}</p>
  {/if}
  
  {#if success}
  <p style="color: green;">{success}</p>
  {/if}
  
  <form on:submit|preventDefault={changePassword}>
    <label>
      Old Password:
      <input type="password" bind:value={oldPassword} required />
    </label>
    <br />
    <label>
      New Password:
      <input type="password" bind:value={newPassword} required />
    </label>
    <br />
    <label>
      Confirm New Password:
      <input type="password" bind:value={confirmPassword} required />
    </label>
    <br />
    <button type="submit">Change Password</button>
  </form>
  