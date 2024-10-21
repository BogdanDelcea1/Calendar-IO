<!-- src/components/BookingModal.svelte -->

<script>
    export let booking;
    export let onClose;
  </script>
  
  <div class="modal-overlay" on:click={onClose}>
    <div class="modal-content" on:click|stopPropagation>
      <button class="close-button" on:click={onClose}>×</button>
      <h2>{booking.title}</h2>
      <p><strong>Duration:</strong> {booking.duration} minutes</p>
      <p><strong>Platform:</strong> {booking.platform}</p>
      <p><strong>Start Time:</strong> {new Date(booking.startTime).toLocaleString()}</p>
      <p><strong>End Time:</strong> {new Date(booking.endTime).toLocaleString()}</p>
      <!-- Add more details as needed -->
    </div>
  </div>
  
  <style>
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
  
    .modal-content {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      position: relative;
      max-width: 500px;
      width: 90%;
    }
  
    .close-button {
      position: absolute;
      top: 0.5rem;
      right: 1rem;
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
    }
  </style>
  