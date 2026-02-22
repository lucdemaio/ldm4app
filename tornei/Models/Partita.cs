namespace GestionaleTorneiWeb.Models
{
    /// <summary>
    /// Rappresenta una partita del torneo
    /// </summary>
    public class Partita : EntityBase
    {
        private int _squadraCasaId;
        private int _squadraTrasfertaId;
        private int? _golCasa;
        private int? _golTrasferta;
        private DateTime? _dataOra;
        private string _campo = string.Empty;
        private string _note = string.Empty;
        private StatoPartita _stato;
        private int _giornataId;
        private int _torneoId;

        public int SquadraCasaId
        {
            get => _squadraCasaId;
            set => SetProperty(ref _squadraCasaId, value);
        }

        public int SquadraTrasfertaId
        {
            get => _squadraTrasfertaId;
            set => SetProperty(ref _squadraTrasfertaId, value);
        }

        public int? GolCasa
        {
            get => _golCasa;
            set
            {
                SetProperty(ref _golCasa, value);
                OnPropertyChanged(nameof(Risultato));
                OnPropertyChanged(nameof(IsGiocata));
            }
        }

        public int? GolTrasferta
        {
            get => _golTrasferta;
            set
            {
                SetProperty(ref _golTrasferta, value);
                OnPropertyChanged(nameof(Risultato));
                OnPropertyChanged(nameof(IsGiocata));
            }
        }

        public DateTime? DataOra
        {
            get => _dataOra;
            set => SetProperty(ref _dataOra, value);
        }

        public string Campo
        {
            get => _campo;
            set => SetProperty(ref _campo, value);
        }

        public string Note
        {
            get => _note;
            set => SetProperty(ref _note, value);
        }

        public StatoPartita Stato
        {
            get => _stato;
            set => SetProperty(ref _stato, value);
        }

        public int GiornataId
        {
            get => _giornataId;
            set => SetProperty(ref _giornataId, value);
        }

        public int TorneoId
        {
            get => _torneoId;
            set => SetProperty(ref _torneoId, value);
        }

        // Navigation Properties
        public Squadra? SquadraCasa { get; set; }
        public Squadra? SquadraTrasferta { get; set; }
        public Giornata? Giornata { get; set; }
        public Torneo? Torneo { get; set; }

        // Proprietà calcolate
        public string Risultato => GolCasa.HasValue && GolTrasferta.HasValue
            ? $"{GolCasa} - {GolTrasferta}"
            : "- - -";

        public bool IsGiocata => GolCasa.HasValue && GolTrasferta.HasValue;

        public Partita()
        {
            CreatedAt = DateTime.Now;
            Stato = StatoPartita.DaProgrammare;
        }

        /// <summary>
        /// Imposta il risultato della partita
        /// </summary>
        public void ImpostaRisultato(int golCasa, int golTrasferta)
        {
            GolCasa = golCasa;
            GolTrasferta = golTrasferta;
            Stato = StatoPartita.Conclusa;
            UpdatedAt = DateTime.Now;
        }
    }
}
