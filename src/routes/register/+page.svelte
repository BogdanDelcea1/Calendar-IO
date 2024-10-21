<!-- src/routes/register/+page.svelte -->

<script>
    import { goto } from '$app/navigation';
    let username = '';
    let email = '';
    let password = '';
    let confirmPassword = '';
    let error = '';
    let success = '';
  
    async function handleRegister(event) {
      event.preventDefault();
      error = '';
      success = '';
  
      if (password !== confirmPassword) {
        error = 'Passwords do not match.';
        return;
      }
  
      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, email, password }),
        });
  
        const data = await res.json();
  
        if (res.ok) {
          success = data.message;
          // Redirect to login page after successful registration
          setTimeout(() => {
            goto('/login');
          }, 2000);
        } else {
          error = data.error || 'An unexpected error occurred.';
        }
      } catch (err) {
        console.error('Registration Error:', err);
        error = 'An error occurred while attempting to register.';
      }
    }
  </script>
  
  <main>
    <h1>Register</h1>
  
    {#if error}
      <p style="color: red;">{error}</p>
    {/if}
  
    {#if success}
      <p style="color: green;">{success}</p>
    {/if}
  
    <form on:submit|preventDefault={handleRegister}>
      <div>
        <label for="username">Username:</label><br />
        <input type="text" id="username" bind:value={username} required />
      </div>
  
      <div>
        <label for="email">Email:</label><br />
        <input type="email" id="email" bind:value={email} required />
      </div>
  
      <div>
        <label for="password">Password:</label><br />
        <input type="password" id="password" bind:value={password} required />
      </div>
  
      <div>
        <label for="confirmPassword">Confirm Password:</label><br />
        <input type="password" id="confirmPassword" bind:value={confirmPassword} required />
      </div>
  
      <button type="submit">Register</button>
    </form>
  
    <p>
      Already have an account? <a href="/login">Login here</a>.
    </p>
  </main>
  
  <style>
    main {
      padding: 2rem;
      max-width: 400px;
      margin: 0 auto;
    }
  
    form div {
      margin-bottom: 1rem;
    }
  
    label {
      font-weight: bold;
    }
  
    input {
      width: 100%;
      padding: 0.5rem;
      box-sizing: border-box;
    }
  
    button {
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
    }
  
    p {
      font-size: 1rem;
    }
  
    a {
      color: #3498db;
      text-decoration: none;
    }
  
    a:hover {
      text-decoration: underline;
    }
  </style>
  