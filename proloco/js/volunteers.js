// Gestione Volontari
class VolunteersManager {
  constructor() {
    this.volunteers = storage.get('volunteers') || [];
  }

  // Aggiungi volontario
  addVolunteer(volunteerData) {
    const volunteer = {
      id: Utils.generateId(),
      name: volunteerData.name,
      email: volunteerData.email,
      phone: volunteerData.phone,
      role: volunteerData.role,
      status: 'active', // active, inactive
      skills: volunteerData.skills?.split(',').map(s => s.trim()) || [],
      totalHours: 0,
      availableDays: volunteerData.availableDays?.split(',').map(d => d.trim()) || [],
      notes: volunteerData.notes || '',
      joinDate: new Date().toISOString()
    };

    // Validazione
    if (!Utils.isEmail(volunteer.email)) {
      Utils.showAlert('Email non valida!', 'danger');
      return null;
    }

    this.volunteers.push(volunteer);
    this.save();
    Utils.showAlert('Volontario registrato con successo!', 'success');
    return volunteer;
  }

  // Modifica volontario
  updateVolunteer(id, volunteerData) {
    this.volunteers = Utils.updateById(this.volunteers, id, volunteerData);
    this.save();
    Utils.showAlert('Volontario aggiornato!', 'success');
  }

  // Elimina volontario
  deleteVolunteer(id) {
    this.volunteers = Utils.removeById(this.volunteers, id);
    this.save();
    Utils.showAlert('Volontario eliminato!', 'success');
  }

  // Ottieni volontario per ID
  getVolunteer(id) {
    return Utils.findById(this.volunteers, id);
  }

  // Ottieni tutti i volontari
  getAllVolunteers() {
    return this.volunteers;
  }

  // Filtra per status
  getVolunteersByStatus(status) {
    return this.volunteers.filter(v => v.status === status);
  }

  // Ottieni volontari per abilità
  getVolunteersBySkill(skill) {
    return this.volunteers.filter(v => v.skills.includes(skill));
  }

  // Aggiungi ore
  addHours(volunteerId, hours) {
    const volunteer = this.getVolunteer(volunteerId);
    if (volunteer) {
      volunteer.totalHours += parseFloat(hours) || 0;
      this.save();
      Utils.showAlert('Ore registrate!', 'success');
    }
  }

  // Statistiche
  getStats() {
    const active = this.getVolunteersByStatus('active');
    return {
      total: this.volunteers.length,
      active: active.length,
      inactive: this.getVolunteersByStatus('inactive').length,
      totalHours: Utils.sum(this.volunteers, 'totalHours'),
      averageHours: active.length > 0 ? Utils.average(active, 'totalHours') : 0
    };
  }

  // Ottieni volontari per giorno disponibile
  getAvailableVolunteersByDay(day) {
    return this.volunteers.filter(v => 
      v.status === 'active' && v.availableDays.includes(day)
    );
  }

  // Salva i dati
  save() {
    storage.set('volunteers', this.volunteers);
  }

  // Rendering HTML
  renderVolunteerCard(volunteer) {
    return `
      <div class="card volunteer-card" data-id="${volunteer.id}">
        <div class="card-header">
          <div>
            <div class="card-title">${volunteer.name}</div>
            <span class="badge badge-${volunteer.status === 'active' ? 'success' : 'danger'}">
              ${volunteer.status === 'active' ? 'Attivo' : 'Inattivo'}
            </span>
          </div>
          <div style="display: flex; gap: 5px;">
            <button class="btn btn-sm btn-primary" onclick="exportManager.exportVolunteersPDF()">📄 PDF</button>
            <button class="btn btn-sm btn-secondary" onclick="sendMessageVolunteer('${volunteer.id}')">💬 Messaggio</button>
            <button class="btn btn-sm btn-secondary" onclick="editVolunteer('${volunteer.id}')">✏️ Modifica</button>
            <button class="btn btn-sm btn-danger" onclick="deleteVolunteer('${volunteer.id}')">🗑️ Elimina</button>
          </div>
        </div>
        <div class="card-body">
          <p><strong>📧 Email:</strong> ${volunteer.email}</p>
          <p><strong>📱 Telefono:</strong> ${volunteer.phone}</p>
          <p><strong>👔 Ruolo:</strong> ${volunteer.role}</p>
          <p><strong>💼 Abilità:</strong> ${volunteer.skills.join(', ') || 'Nessuna'}</p>
          <p><strong>📅 Disponibilità:</strong> ${volunteer.availableDays.join(', ') || 'Non specificata'}</p>
          <p><strong>⏱️ Ore totali:</strong> ${volunteer.totalHours}h</p>
          ${volunteer.notes ? `<p><strong>📝 Note:</strong> ${volunteer.notes}</p>` : ''}
        </div>
      </div>
    `;
  }
}

// Istanza globale
const volunteersManager = new VolunteersManager();
