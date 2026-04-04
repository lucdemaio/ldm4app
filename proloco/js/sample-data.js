// Dati di esempio per test
const SAMPLE_DATA = {
  // Informazioni Pro Loco
  prolocoInfo: {
    name: 'Pro Loco Lombardia',
    email: 'info@proloco-lombardia.it',
    phone: '+39 341 234 5678',
    website: 'https://www.proloco-lombardia.it',
    address: 'Via Roma 123',
    city: 'Milano',
    province: 'MI',
    region: 'Lombardia',
    foundingYear: 2010,
    description: 'Pro Loco dedicata alla valorizzazione del turismo e della cultura lombarda',
    colors: {
      primary: '#6366f1',
      secondary: '#10b981'
    },
    socialMedia: {
      facebook: 'https://facebook.com/proloco-lombardia',
      instagram: 'https://instagram.com/proloco.lombardia',
      twitter: 'https://twitter.com/proloco_lombardia',
      linkedin: 'https://linkedin.com/company/proloco-lombardia'
    }
  },

  // Eventi di esempio
  events: [
    {
      id: 'evt-001',
      title: 'Festival Enogastronomico',
      description: 'Festa dedicata ai sapori lombardi',
      date: '2024-06-15',
      time: '17:00',
      location: 'Piazza Duomo, Milano',
      category: 'Festival',
      status: 'planned',
      expectedVisitors: 3000,
      budget: 15000,
      volunteers: ['vol-001', 'vol-002'],
      tasks: ['tsk-001', 'tsk-002'],
      createdAt: new Date().toISOString()
    },
    {
      id: 'evt-002',
      title: 'Visita Guidata Musei',
      description: 'Tour dei principali musei milanesi',
      date: '2024-05-20',
      time: '10:00',
      location: 'Pinacoteca di Brera',
      category: 'Cultura',
      status: 'ongoing',
      expectedVisitors: 50,
      budget: 2000,
      volunteers: ['vol-003'],
      tasks: ['tsk-003'],
      createdAt: new Date().toISOString()
    },
    {
      id: 'evt-003',
      title: 'Mercato Artigianale',
      description: 'Mostra e vendita di artigianato locale',
      date: '2024-05-30',
      time: '09:00',
      location: 'Parco Lambro',
      category: 'Commercio',
      status: 'planned',
      expectedVisitors: 2000,
      budget: 5000,
      volunteers: [],
      tasks: [],
      createdAt: new Date().toISOString()
    }
  ],

  // Volontari di esempio
  volunteers: [
    {
      id: 'vol-001',
      name: 'Marco Rossi',
      email: 'marco.rossi@email.com',
      phone: '+39 341 123 4567',
      role: 'Coordinatore',
      status: 'active',
      skills: ['Organizzazione', 'Comunicazione', 'Logistica'],
      totalHours: 45,
      availableDays: ['Lunedì', 'Mercoledì', 'Venerdì'],
      notes: 'Esperienza nella gestione di grandi eventi',
      joinDate: new Date().toISOString()
    },
    {
      id: 'vol-002',
      name: 'Elena Bianchi',
      email: 'elena.bianchi@email.com',
      phone: '+39 342 234 5678',
      role: 'Segretaria',
      status: 'active',
      skills: ['Segreteria', 'Contabilità', 'Informatica'],
      totalHours: 32,
      availableDays: ['Martedì', 'Giovedì'],
      notes: 'Responsabile della comunicazione ufficiale',
      joinDate: new Date().toISOString()
    },
    {
      id: 'vol-003',
      name: 'Giovanni Neri',
      email: 'giovanni.neri@email.com',
      phone: '+39 340 345 6789',
      role: 'Operativo',
      status: 'active',
      skills: ['Logistica', 'Montaggio', 'Sicurezza'],
      totalHours: 28,
      availableDays: ['Sabato', 'Domenica'],
      notes: 'Esperto di allestimenti e sicurezza',
      joinDate: new Date().toISOString()
    },
    {
      id: 'vol-004',
      name: 'Carla Verdi',
      email: 'carla.verdi@email.com',
      phone: '+39 345 456 7890',
      role: 'Promotore',
      status: 'inactive',
      skills: ['Marketing', 'Social Media'],
      totalHours: 15,
      availableDays: [],
      notes: 'Precedentemente attiva sui social',
      joinDate: new Date().toISOString()
    }
  ],

  // Budget di esempio
  budget: {
    entries: [
      {
        id: 'bdg-001',
        description: 'Sponsorship Comune di Milano',
        type: 'income',
        amount: 5000,
        category: 'Sponsorizzazione',
        date: '2024-04-01',
        notes: 'Contributo per attività 2024',
        eventId: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'bdg-002',
        description: 'Iscrizioni volontari',
        type: 'income',
        amount: 1200,
        category: 'Iscrizioni',
        date: '2024-04-15',
        notes: '',
        eventId: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'bdg-003',
        description: 'Affitto attrezzature',
        type: 'expense',
        amount: 800,
        category: 'Affitti',
        date: '2024-05-10',
        notes: 'Noleggio tavoli e sedie per evento',
        eventId: 'evt-001',
        createdAt: new Date().toISOString()
      },
      {
        id: 'bdg-004',
        description: 'Acquisto materiali promozionali',
        type: 'expense',
        amount: 450,
        category: 'Marketing',
        date: '2024-05-12',
        notes: 'Flyer e locandine',
        eventId: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'bdg-005',
        description: 'Catering evento',
        type: 'expense',
        amount: 3200,
        category: 'Servizi',
        date: '2024-05-15',
        notes: 'Buffet fornitori locali',
        eventId: 'evt-001',
        createdAt: new Date().toISOString()
      }
    ],
    categories: ['Materiali', 'Servizi', 'Personale', 'Affitti', 'Marketing', 'Logistica', 'Sponsorizzazione', 'Iscrizioni', 'Altro']
  },

  // Compiti di esempio
  tasks: [
    {
      id: 'tsk-001',
      title: 'Contattare fornitori catering',
      description: 'Programmare riunione con i fornitori dei cibi per il festival',
      priority: 'high',
      status: 'in-progress',
      dueDate: '2024-05-20',
      assignedTo: 'vol-001',
      eventId: 'evt-001',
      tags: ['Festival', 'Catering', 'Urgente'],
      createdAt: new Date().toISOString()
    },
    {
      id: 'tsk-002',
      title: 'Preparare inviti stampa',
      description: 'Redigere e stampare inviti per la stampa locale',
      priority: 'high',
      status: 'pending',
      dueDate: '2024-05-18',
      assignedTo: 'vol-002',
      eventId: 'evt-001',
      tags: ['Festival', 'Stampa'],
      createdAt: new Date().toISOString()
    },
    {
      id: 'tsk-003',
      title: 'Prenotare pullman per trasporto visitatori',
      description: 'Contattare aziende di trasporto per il noleggio pullman',
      priority: 'normal',
      status: 'pending',
      dueDate: '2024-05-22',
      assignedTo: 'vol-001',
      eventId: 'evt-002',
      tags: ['Trasporto', 'Logistica'],
      createdAt: new Date().toISOString()
    },
    {
      id: 'tsk-004',
      title: 'Verificare assicurazioni volontari',
      description: 'Controllare che tutti i volontari siano assicurati',
      priority: 'high',
      status: 'pending',
      dueDate: '2024-05-25',
      assignedTo: null,
      eventId: 'evt-001',
      tags: ['Amministrazione', 'Sicurezza'],
      createdAt: new Date().toISOString()
    },
    {
      id: 'tsk-005',
      title: 'Progettazione manifesto evento',
      description: 'Creare design per il manifesto principale',
      priority: 'normal',
      status: 'completed',
      dueDate: '2024-05-10',
      assignedTo: null,
      eventId: 'evt-001',
      tags: ['Grafica', 'Marketing'],
      createdAt: new Date().toISOString()
    }
  ]
};

// Funzione per caricare dati di esempio
function loadSampleData() {
  if (confirm('Carica dati di esempio?\n\nQuesto sovrascriverà i dati attuali.')) {
    storage.set('proloco-info', SAMPLE_DATA.prolocoInfo);
    storage.set('events', SAMPLE_DATA.events);
    storage.set('volunteers', SAMPLE_DATA.volunteers);
    storage.set('budget', SAMPLE_DATA.budget);
    storage.set('tasks', SAMPLE_DATA.tasks);
    
    Utils.showAlert('Dati di esempio caricati! Ricarica la pagina.', 'success');
    setTimeout(() => location.reload(), 2000);
  }
}

// Scorciatoia per caricare dati
window.loadSampleData = loadSampleData;

// Istruzioni per l'uso da console
console.log('%cPro Loco Gestionale 2026', 'font-size: 20px; font-weight: bold; color: #6366f1;');
console.log('Pronto all\'uso! Per caricare dati di esempio, esegui: loadSampleData()');
