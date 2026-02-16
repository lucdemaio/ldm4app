// Adds btn-glass classes to existing .btn elements for consistent glass styling
(function(){
  function applyGlass(){
    document.querySelectorAll('button.btn, a.btn').forEach(btn=>{
      if(btn.classList.contains('btn-glass')) return; // already explicit
      if(btn.classList.contains('btn-primary')) btn.classList.add('btn-glass','primary');
      else if(btn.classList.contains('btn-secondary')) btn.classList.add('btn-glass','secondary');
      else if(btn.classList.contains('btn-success')) btn.classList.add('btn-glass','primary');
      else if(btn.classList.contains('btn-danger')) btn.classList.add('btn-glass','danger');
    });
  }
  document.addEventListener('DOMContentLoaded', applyGlass);
})();