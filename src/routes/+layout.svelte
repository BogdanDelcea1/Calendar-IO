<!-- src/routes/+layout.svelte -->

<script>
  import Navbar from '$components/Navbar.svelte';
</script>

<main>
  <Navbar />
  <section class="content-container">
    <slot />
  </section>
</main>

<style>
  :global(body) {
    font-family: 'Poppins', sans-serif;
    background-color: #f4f4f9; /* Light background for normal mode */
    color: #333; /* Dark text for normal mode */
    line-height: 1.6;
    transition: background-color 0.5s ease, color 0.5s ease;
  }

  /* Headings (h2) styling */
  :global(h2) {
    color: black; /* Default h2 color for light mode */
    font-size: 2rem; /* Adjust font size if needed */
    margin-bottom: 1rem;
  }

  :global(.dark-mode h2) {
    color: white; /* White h2 color for dark mode */
  }

  :global(.dark-mode body) {
    background-color: #121212; /* Dark background for night mode */
    color: #ffffff; /* Light text for night mode */
  }

  main {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .content-container {
    margin-top: 80px;
    padding: 2rem;
    max-width: 1200px;
    margin: 80px auto 0;
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease, background-color 0.5s ease;
  }

  :global(.dark-mode) .content-container {
    background-color: #1e1e1e; /* Darker background for content in night mode */
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5); /* Darker shadow */
  }

  /* Responsive Design for Mobile */
  @media (max-width: 768px) {
    .content-container {
      padding: 1.5rem;
      margin-top: 100px;
    }
  }
</style>
