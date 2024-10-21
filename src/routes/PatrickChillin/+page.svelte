<!-- src/routes/PatrickChild/+page.svelte -->

<script>
    import { onMount } from 'svelte';
    
    onMount(() => {
    });
  </script>
  
  <main class="fullscreen-container">
    <img src="/static-image.jpg" alt="Easter Egg" class="fullscreen-image" />
  </main>
  
  <style>
    .fullscreen-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
    }
  
    .fullscreen-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  </style>
  