// Local: /Models/Jogo.cs
namespace Ludoteca.Models
{
    public class Jogo
    {
        public int Id { get; set; }
        public string Nome { get; set; } = "";
        public int AnoLancamento { get; set; }
        public bool Disponivel { get; set; }

        public Jogo(int id, string nome, int anoLancamento)
        {
            if (string.IsNullOrWhiteSpace(nome))
                throw new ArgumentException("O nome do jogo não pode ser vazio.", nameof(nome));

            if (anoLancamento > DateTime.Now.Year)
                throw new ArgumentException("O ano de lançamento não pode ser no futuro.", nameof(anoLancamento));

            Id = id;
            Nome = nome;
            AnoLancamento = anoLancamento;
            Disponivel = true;
        }
        
        // Construtor sem parâmetros necessário para a desserialização do JSON
        public Jogo() {}
    }
}