// Storage Manager - Gestisce i dati con localStorage
class StorageManager {
  constructor(prefix = 'proloco_') {
    this.prefix = prefix;
    this.initializeData();
  }

  initializeData() {
    // Inizializza dati di esempio se non esistono
    if (!this.get('proloco-info')) {
      this.set('proloco-info', {
        name: 'Pro Loco Locale',
        email: 'info@proloco.local',
        phone: '+39 000 000 0000',
        website: 'https://www.proloco.local',
        address: 'Via Principale, 1',
        city: 'Città',
        province: 'Provincia',
        region: 'Regione',
        foundingYear: new Date().getFullYear(),
        description: 'Benvenuto nella nostra Pro Loco',
        logo: null,
        colors: {
          primary: '#6366f1',
          secondary: '#10b981'
        },
        socialMedia: {
          facebook: '',
          instagram: '',
          twitter: '',
          linkedin: ''
        },
        notifications: {
          emailNotifications: true,
          smsNotifications: false
        }
      });
    }

    if (!this.get('events')) {
      this.set('events', []);
    }

    if (!this.get('volunteers')) {
      this.set('volunteers', []);
    }

    if (!this.get('budget')) {
      this.set('budget', {
        entries: [],
        categories: ['Materiali', 'Servizi', 'Personale', 'Affitti', 'Marketing', 'Logistica', 'Altro']
      });
    }

    if (!this.get('tasks')) {
      this.set('tasks', []);
    }
  }

  set(key, value) {
    localStorage.setItem(this.prefix + key, JSON.stringify(value));
  }

  get(key) {
    const item = localStorage.getItem(this.prefix + key);
    return item ? JSON.parse(item) : null;
  }

  remove(key) {
    localStorage.removeItem(this.prefix + key);
  }

  clear() {
    for (let key in localStorage) {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    }
  }
}

// Istanza globale
const storage = new StorageManager();
