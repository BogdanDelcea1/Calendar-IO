<!-- src/routes/bookings/edit/[bookingId]/+error.svelte -->

<script>
    export let error;
    export let status;
  </script>
  
  <main>
    <h1>Error {status}</h1>
    <p>{error.message}</p>
    <button on:click={() => history.back()}>Go Back</button>
  </main>
  
  <style>
    main {
      padding: 2rem;
      text-align: center;
    }
  
    h1 {
      color: #e74c3c;
    }
  
    button {
      padding: 0.5rem 1rem;
      background-color: #3498db;
      color: white;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      margin-top: 1rem;
    }
  
    button:hover {
      background-color: #2980b9;
    }
  </style>
  