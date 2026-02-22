namespace GestionaleTorneiWeb.Models
{
    /// <summary>
    /// Rappresenta una giornata del calendario (per algoritmo Round Robin)
    /// </summary>
    public class Giornata : EntityBase
    {
        private int _numero;
        private int _torneoId;
        private DateTime? _dataInizio;
        private DateTime? _dataFine;
        private bool _completata;

        public int Numero
        {
            get => _numero;
            set => SetProperty(ref _numero, value);
        }

        public int TorneoId
        {
            get => _torneoId;
            set => SetProperty(ref _torneoId, value);
        }

        public DateTime? DataInizio
        {
            get => _dataInizio;
            set => SetProperty(ref _dataInizio, value);
        }

        public DateTime? DataFine
        {
            get => _dataFine;
            set => SetProperty(ref _dataFine, value);
        }

        public bool Completata
        {
            get => _completata;
            set => SetProperty(ref _completata, value);
        }

        // Navigation Properties
        public Torneo? Torneo { get; set; }
        public List<Partita> Partite { get; set; } = new();

        public Giornata()
        {
            CreatedAt = DateTime.Now;
        }

        /// <summary>
        /// Verifica se tutte le partite della giornata sono state giocate
        /// </summary>
        public bool VerificaCompletamento()
        {
            Completata = Partite.All(p => p.IsGiocata);
            if (Completata && !DataFine.HasValue)
            {
                DataFine = DateTime.Now;
                UpdatedAt = DateTime.Now;
            }
            return Completata;
        }
    }
}
