// Local: /Models/Emprestimo.cs
namespace Ludoteca.Models
{
    public class Emprestimo
    {
        public int Id { get; set; }
        public int JogoId { get; set; }
        public int MembroId { get; set; }
        public DateTime DataEmprestimo { get; set; }
        public DateTime DataDevolucaoPrevista { get; set; }
        public DateTime? DataDevolucaoReal { get; set; }

        public Emprestimo(int id, int jogoId, int membroId)
        {
            Id = id;
            JogoId = jogoId;
            MembroId = membroId;
            DataEmprestimo = DateTime.Now;
            DataDevolucaoPrevista = DateTime.Now.AddDays(14);
            DataDevolucaoReal = null;
        }

        public Emprestimo() {}
    }
}