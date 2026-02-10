using System.Globalization;

namespace GestionaleTorneiWeb.Utilities
{
    public static class NumberFormattingExtensions
    {
        public static string ToF2(this double value, string culture = "it-IT")
        {
            return value.ToString("F2", new CultureInfo(culture));
        }

        public static string ToF2(this double? value, string culture = "it-IT")
        {
            return value?.ToString("F2", new CultureInfo(culture)) ?? string.Empty;
        }

        public static string ToF1(this double value, string culture = "it-IT")
        {
            return value.ToString("F1", new CultureInfo(culture));
        }

        public static string ToF1(this double? value, string culture = "it-IT")
        {
            return value?.ToString("F1", new CultureInfo(culture)) ?? string.Empty;
        }
    }
}