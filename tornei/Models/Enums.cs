namespace GestionaleTorneiWeb.Models
{
    /// <summary>
    /// Tipologie di torneo supportate
    /// </summary>
    public enum TipoTorneo
    {
        GironeAllItaliana = 0,
        Eliminazione = 1,
        Misto = 2
    }

    /// <summary>
    /// Stati del torneo
    /// </summary>
    public enum StatoTorneo
    {
        InPreparazione = 0,
        InCorso = 1,
        Completato = 2,
        Sospeso = 3,
        Annullato = 4
    }

    /// <summary>
    /// Stati della partita
    /// </summary>
    public enum StatoPartita
    {
        DaProgrammare = 0,
        Programmata = 1,
        InCorso = 2,
        Conclusa = 3,
        Rinviata = 4,
        Annullata = 5
    }
}
