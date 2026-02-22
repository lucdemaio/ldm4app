namespace GestionaleTorneiWeb.Models
{
    /// <summary>
    /// Rappresenta una squadra partecipante al torneo
    /// </summary>
    public class Squadra : EntityBase
    {
        private string _nome = string.Empty;
        private string _logo = string.Empty;
        private string _contatto = string.Empty;
        private string _email = string.Empty;
        private string _telefono = string.Empty;
        private int _torneoId;
        private int _partiteGiocate;
        private int _vittorie;
        private int _pareggi;
        private int _sconfitte;
        private int _golFatti;
        private int _golSubiti;

        public string Nome
        {
            get => _nome;
            set => SetProperty(ref _nome, value);
        }

        public string Logo
        {
            get => _logo;
            set => SetProperty(ref _logo, value);
        }

        public string Contatto
        {
            get => _contatto;
            set => SetProperty(ref _contatto, value);
        }

        public string Email
        {
            get => _email;
            set => SetProperty(ref _email, value);
        }

        public string Telefono
        {
            get => _telefono;
            set => SetProperty(ref _telefono, value);
        }

        public int TorneoId
        {
            get => _torneoId;
            set => SetProperty(ref _torneoId, value);
        }

        public int PartiteGiocate
        {
            get => _partiteGiocate;
            set
            {
                SetProperty(ref _partiteGiocate, value);
                OnPropertyChanged(nameof(Punti));
            }
        }

        public int Vittorie
        {
            get => _vittorie;
            set
            {
                SetProperty(ref _vittorie, value);
                OnPropertyChanged(nameof(Punti));
            }
        }

        public int Pareggi
        {
            get => _pareggi;
            set
            {
                SetProperty(ref _pareggi, value);
                OnPropertyChanged(nameof(Punti));
            }
        }

        public int Sconfitte
        {
            get => _sconfitte;
            set => SetProperty(ref _sconfitte, value);
        }

        public int GolFatti
        {
            get => _golFatti;
            set
            {
                SetProperty(ref _golFatti, value);
                OnPropertyChanged(nameof(DifferenzaReti));
            }
        }

        public int GolSubiti
        {
            get => _golSubiti;
            set
            {
                SetProperty(ref _golSubiti, value);
                OnPropertyChanged(nameof(DifferenzaReti));
            }
        }

        // Proprietà calcolate
        public int Punti => (Vittorie * 3) + Pareggi;

        public int DifferenzaReti => GolFatti - GolSubiti;

        // Navigation Property
        public Torneo? Torneo { get; set; }

        public Squadra()
        {
            CreatedAt = DateTime.Now;
        }

        /// <summary>
        /// Aggiorna le statistiche della squadra dopo una partita
        /// </summary>
        public void AggiornaStatistiche(int golFatti, int golSubiti)
        {
            PartiteGiocate++;
            GolFatti += golFatti;
            GolSubiti += golSubiti;

            if (golFatti > golSubiti)
                Vittorie++;
            else if (golFatti == golSubiti)
                Pareggi++;
            else
                Sconfitte++;

            UpdatedAt = DateTime.Now;
        }
    }
}
