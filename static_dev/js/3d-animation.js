document.addEventListener('DOMContentLoaded', function() {
  const eventDates = document.querySelectorAll('.event-date');
  
  eventDates.forEach(date => {
    date.addEventListener('mouseenter', function() {
      this.classList.add('flip');
      
      // Reset animation after it completes
      setTimeout(() => {
        this.classList.remove('flip');
      }, 600);
    });
    
    // Add glow effect on hover
    date.addEventListener('mouseover', function() {
      const day = this.querySelector('.day');
      const month = this.querySelector('.month');
      const year = this.querySelector('.year');
      
      day.style.textShadow = '0 0 10px rgba(255, 255, 255, 0.8)';
      month.style.textShadow = '0 0 8px rgba(255, 255, 255, 0.6)';
      year.style.textShadow = '0 0 6px rgba(255, 255, 255, 0.4)';
    });
    
    date.addEventListener('mouseout', function() {
      const day = this.querySelector('.day');
      const month = this.querySelector('.month');
      const year = this.querySelector('.year');
      
      day.style.textShadow = 'none';
      month.style.textShadow = 'none';
      year.style.textShadow = 'none';
    });
  });
});