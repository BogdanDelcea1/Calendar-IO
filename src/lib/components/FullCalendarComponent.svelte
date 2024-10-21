<!-- src/lib/components/FullCalendarComponent.svelte -->

<script>
    import { onMount } from 'svelte';
    import { Calendar } from '@fullcalendar/core';
    import dayGridPlugin from '@fullcalendar/daygrid';
    import timeGridPlugin from '@fullcalendar/timegrid';
    import interactionPlugin from '@fullcalendar/interaction';
  
    export let events = [];
    export let onDateClick = () => {};
    export let onEventClick = () => {};
  
    let calendarEl;
  
    onMount(() => {
      const calendar = new Calendar(calendarEl, {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
        initialView: 'dayGridMonth',
        events: events,
        dateClick: function(info) {
          onDateClick(info);
        },
        eventClick: function(info) {
          onEventClick(info.event);
        },
        height: '100%',
      });
  
      calendar.render();
  
      // Clean up on component destroy
      return () => {
        calendar.destroy();
      };
    });
  </script>
  
  <div bind:this={calendarEl}></div>
  