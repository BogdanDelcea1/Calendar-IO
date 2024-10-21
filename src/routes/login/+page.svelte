<!-- src/routes/login/+page.svelte -->

<script>
  import { goto } from '$app/navigation';
  let identifier = ''; // Can be username or email
  let password = '';
  let error = '';
  let success = '';

  async function handleLogin(event) {
    event.preventDefault();
    error = '';
    success = '';

    if (!identifier || !password) {
      error = 'Please enter your username/email and password.';
      return;
    }

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: identifier.includes('@') ? undefined : identifier,
          email: identifier.includes('@') ? identifier : undefined,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        success = data.message;
        // Redirect to the calendar or another protected page
        setTimeout(() => {
          goto('/calendar');
        }, 2000);
      } else {
        error = data.error || 'An unexpected error occurred.';
      }
    } catch (err) {
      console.error('Login Error:', err);
      error = 'An error occurred while attempting to log in.';
    }
  }
</script>

<main>
  <h1>Login</h1>

  {#if error}
    <p style="color: red;">{error}</p>
  {/if}

  {#if success}
    <p style="color: green;">{success}</p>
  {/if}

  <form on:submit|preventDefault={handleLogin}>
    <div>
      <label for="identifier">Username or Email:</label><br />
      <input type="text" id="identifier" bind:value={identifier} required />
    </div>

    <div>
      <label for="password">Password:</label><br />
      <input type="password" id="password" bind:value={password} required />
    </div>

    <button type="submit">Login</button>
  </form>

  <p>
    Don't have an account? <a href="/register">Register here</a>.
  </p>

  <hr />

  <button type="button" on:click={() => goto('/auth/google')}>
    Sign in with Google
  </button>
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
    margin-top: 1rem;
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

  hr {
    margin: 2rem 0;
  }
</style>
