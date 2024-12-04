<!-- src/components/Navbar.svelte -->

<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { writable } from 'svelte/store';

  let user;
  let profileImage = '/default-profile.png';
  
  // Store for dark mode state
  const darkMode = writable(false);

  // Easter egg variables
  let clickCount = 0;
  let clickTimer;

  // Check if user prefers dark mode
  $: if (browser) {
    darkMode.set(localStorage.getItem('darkMode') === 'true');
  }

  // Toggle night mode function
  function toggleNightMode() {
    darkMode.update((value) => {
      const newValue = !value;
      if (browser) {
        localStorage.setItem('darkMode', newValue);
        document.documentElement.classList.toggle('dark-mode', newValue);
      }
      return newValue;
    });
  }

  // Logout function
  async function logout() {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        user = null;
        await goto('/login');
      } else {
        console.error('Failed to log out.');
        await goto('/login');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      await goto('/login');
    }
  }

  // Handle button clicks for Easter egg
  function handleButtonClick() {
    clickCount++;
    //print(clickCount);
    //console.info(clickCount)
    // If the user clicks 10 times within 5 seconds, redirect to the Easter egg route
    if (clickCount >= 10) {
      goto('/PatrickChillin');
      return;
    }

    // If the timer is not running, start it
    if (!clickTimer) {
      clickTimer = setTimeout(() => {
        clickCount = 0; // Reset the click count after 5 seconds
        clickTimer = null; // Clear the timer
      }, 5000); // 5-second timeout
    }
  }

  $: user = $page.data.user;

  function isActive(route) {
    return $page.url.pathname === route;
  }
</script>

<nav>
  <ul>
    <li><a href="/" class={isActive('/') ? 'active' : ''}>Home</a></li>
    {#if user}
      <li><a href="/calendar" class={isActive('/calendar') ? 'active' : ''}>Calendar</a></li>
      <li><a href="/bookings" class={isActive('/bookings/new') ? 'active' : ''}>New Booking</a></li>
      <li><a href="/bookings/list" class={isActive('/bookings/list') ? 'active' : ''}>Pending Bookings</a></li>
    {/if}
  </ul>

  {#if user}
    <div class="profile-section">
      <button on:click={toggleNightMode} class="toggle-night">
        {#if $darkMode} ☀️ Light Mode {/if}
        {#if !$darkMode} 🌙 Night Mode {/if}
      </button>
      <button on:click={logout}>Logout</button>
      <a href="/profile">
        <img
          src={profileImage}
          alt="User's profile picture"
          class="profile-picture"
        />
      </a>
    </div>
  {:else}
    <ul>
      <li><a href="/login">Login</a></li>
      <li><a href="/register">Register</a></li>
    </ul>
  {/if}
</nav>

<style>
  nav {
    background-color: var(--navbar-bg-color);
    padding: 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: background-color 0.5s ease;
  }

  ul {
    list-style: none;
    display: flex;
    gap: 1rem;
    margin: 0;
    padding: 0;
  }

  a {
    color: var(--link-color);
    text-decoration: none;
    transition: color 0.3s ease;
  }

  a:hover {
    color: var(--link-hover-color);
  }

  .active {
    text-decoration: underline;
    font-weight: bold;
  }

  .profile-section {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .profile-picture {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--profile-border-color);
  }

  button {
    background: none;
    border: none;
    color: var(--button-text-color);
    cursor: pointer;
    font: inherit;
    transition: opacity 0.3s ease;
  }

  button:hover {
    opacity: 0.8;
  }

  .toggle-night {
    font-size: 1.2rem;
  }

  /* Light Mode Colors */
  :root {
    --navbar-bg-color: #333;
    --link-color: white;
    --link-hover-color: #ddd;
    --profile-border-color: white;
    --button-text-color: white;
  }

  /* Dark Mode Colors */
  .dark-mode {
    --navbar-bg-color: #1c1c1e;
    --link-color: #f4f4f9;
    --link-hover-color: #ddd;
    --profile-border-color: #f4f4f9;
    --button-text-color: #f4f4f9;
  }

  /* Smooth transitions */
  body {
    transition: background-color 0.5s ease, color 0.5s ease;
  }

  nav, .profile-picture {
    transition: border-color 0.5s ease;
  }
</style>





