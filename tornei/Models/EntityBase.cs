using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace GestionaleTorneiWeb.Models
{
    /// <summary>
    /// Classe base per tutte le entità del dominio.
    /// Implementa INotifyPropertyChanged per il binding.
    /// </summary>
    public abstract class EntityBase : INotifyPropertyChanged
    {
        private int _id;
        private DateTime _createdAt;
        private DateTime? _updatedAt;

        public int Id
        {
            get => _id;
            set { _id = value; OnPropertyChanged(); }
        }

        public DateTime CreatedAt
        {
            get => _createdAt;
            set { _createdAt = value; OnPropertyChanged(); }
        }

        public DateTime? UpdatedAt
        {
            get => _updatedAt;
            set { _updatedAt = value; OnPropertyChanged(); }
        }

        public event PropertyChangedEventHandler? PropertyChanged;

        protected virtual void OnPropertyChanged([CallerMemberName] string? propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }

        protected bool SetProperty<T>(ref T field, T value, [CallerMemberName] string? propertyName = null)
        {
            if (Equals(field, value)) return false;
            field = value;
            OnPropertyChanged(propertyName);
            return true;
        }
    }
}
