// Local: /Models/BibliotecaData.cs
namespace Ludoteca.Models
{
    public class BibliotecaData
    {
        public List<Jogo> Jogos { get; set; } = new List<Jogo>();
        public List<Membro> Membros { get; set; } = new List<Membro>();
        public List<Emprestimo> Emprestimos { get; set; } = new List<Emprestimo>();
    }
}