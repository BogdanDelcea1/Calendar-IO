<!-- src/lib/components/BookingModal.svelte -->

<script>
    export let booking;
    export let onClose;
  
    // Handle keydown events for accessibility (e.g., pressing 'Escape' to close the modal)
    function handleKeydown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
  </script>
  
  <!-- Modal Overlay -->
  <div
    class="modal-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    tabindex="-1"
    on:click={onClose}
    on:keydown={handleKeydown}
  >
    <!-- Modal Content -->
    <div class="modal-content" on:click|stopPropagation>
      <!-- Close Button -->
      <button
        class="close-button"
        on:click={onClose}
        aria-label="Close booking details"
      >
        &times;
      </button>
      <!-- Booking Details -->
      <h2 id="modal-title">{booking.title}</h2>
      <p><strong>Duration:</strong> {booking.duration} minutes</p>
      <p><strong>Platform:</strong> {booking.platform}</p>
      <p><strong>Start Time:</strong> {new Date(booking.startTime).toLocaleString()}</p>
      <p><strong>End Time:</strong> {new Date(booking.endTime).toLocaleString()}</p>
      <!-- Add more booking details as needed -->
    </div>
  </div>
  
  <style>
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
  
    .modal-content {
      background: #fff;
      padding: 2rem;
      border-radius: 8px;
      position: relative;
      width: 90%;
      max-width: 500px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
  
    .close-button {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: transparent;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
    }
  
    .close-button:focus {
      outline: 2px solid #3498db;
    }
  
    h2 {
      margin-top: 0;
    }
  
    p {
      margin: 0.5rem 0;
    }
  </style>
  