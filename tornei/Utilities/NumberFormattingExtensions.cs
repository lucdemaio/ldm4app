<<<<<<< HEAD
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
=======
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
>>>>>>> 864310ad9a57111b0d674f025b9b8724f87cdd58
}