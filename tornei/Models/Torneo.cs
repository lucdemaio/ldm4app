namespace GestionaleTorneiWeb.Models
{
    /// <summary>
    /// Rappresenta un torneo sportivo
    /// </summary>
    public class Torneo : EntityBase
    {
        private string _nome = string.Empty;
        private string _sport = string.Empty;
        private DateTime _dataInizio;
        private DateTime? _dataFine;
        private TipoTorneo _tipo;
        private StatoTorneo _stato;
        private string _descrizione = string.Empty;
        private int _numeroSquadre;

        public string Nome
        {
            get => _nome;
            set => SetProperty(ref _nome, value);
        }

        public string Sport
        {
            get => _sport;
            set => SetProperty(ref _sport, value);
        }

        public DateTime DataInizio
        {
            get => _dataInizio;
            set => SetProperty(ref _dataInizio, value);
        }

        public DateTime? DataFine
        {
            get => _dataFine;
            set => SetProperty(ref _dataFine, value);
        }

        public TipoTorneo Tipo
        {
            get => _tipo;
            set => SetProperty(ref _tipo, value);
        }

        public StatoTorneo Stato
        {
            get => _stato;
            set => SetProperty(ref _stato, value);
        }

        public string Descrizione
        {
            get => _descrizione;
            set => SetProperty(ref _descrizione, value);
        }

        public int NumeroSquadre
        {
            get => _numeroSquadre;
            set => SetProperty(ref _numeroSquadre, value);
        }

        // Relazioni (Navigation Properties)
        public List<Squadra> Squadre { get; set; } = new();
        public List<Partita> Partite { get; set; } = new();
        public List<Giornata> Giornate { get; set; } = new();

        public Torneo()
        {
            CreatedAt = DateTime.Now;
            Stato = StatoTorneo.InPreparazione;
            Tipo = TipoTorneo.GironeAllItaliana;
        }
    }
}
