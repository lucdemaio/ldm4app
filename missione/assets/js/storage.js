// storage.js - semplice wrapper per localStorage
const Storage = (function(){
    function save(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
    function load(key){ try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }catch(e){ return null; } }
    function clear(key){ localStorage.removeItem(key); }
    return {save,load,clear};
})();
