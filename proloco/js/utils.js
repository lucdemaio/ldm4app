// Utilità globali
class Utils {
  // Formattazione date
  static formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('it-IT', options);
  }

  static formatDateTime(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('it-IT', options);
  }

  static formatCurrency(amount) {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  // Generazione ID univoci
  static generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Notifiche
  static showAlert(message, type = 'success') {
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) existingAlert.remove();

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
      <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      <span>${message}</span>
    `;

    const content = document.querySelector('.content');
    if (content) content.insertBefore(alert, content.firstChild);

    setTimeout(() => alert.remove(), 3000);
  }

  // DOM manipulation
  static show(element) {
    if (typeof element === 'string') {
      element = document.getElementById(element);
    }
    if (element) element.style.display = 'block';
  }

  static hide(element) {
    if (typeof element === 'string') {
      element = document.getElementById(element);
    }
    if (element) element.style.display = 'none';
  }

  static addClass(element, className) {
    if (typeof element === 'string') element = document.getElementById(element);
    element?.classList.add(className);
  }

  static removeClass(element, className) {
    if (typeof element === 'string') element = document.getElementById(element);
    element?.classList.remove(className);
  }

  // Validazione
  static isEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  static isPhone(phone) {
    return /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(phone);
  }

  // Array operations
  static findById(array, id) {
    return array.find(item => item.id === id);
  }

  static removeById(array, id) {
    return array.filter(item => item.id !== id);
  }

  static updateById(array, id, newData) {
    return array.map(item => item.id === id ? { ...item, ...newData } : item);
  }

  // Calcoli statistici
  static sum(array, prop) {
    return array.reduce((acc, item) => acc + item[prop], 0);
  }

  static average(array, prop) {
    if (array.length === 0) return 0;
    return this.sum(array, prop) / array.length;
  }

  static groupBy(array, prop) {
    return array.reduce((acc, item) => {
      const key = item[prop];
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }
}
