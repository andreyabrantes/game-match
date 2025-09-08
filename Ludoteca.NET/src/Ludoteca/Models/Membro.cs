// Local: /Models/Membro.cs
namespace Ludoteca.Models
{
    public class Membro
    {
        public int Id { get; set; }
        public string Nome { get; set; } = "";
        public string Matricula { get; set; } = "";

        public Membro(int id, string nome, string matricula)
        {
            if (string.IsNullOrWhiteSpace(nome))
                throw new ArgumentException("O nome do membro não pode ser vazio.", nameof(nome));

            if (string.IsNullOrWhiteSpace(matricula))
                throw new ArgumentException("A matrícula não pode ser vazia.", nameof(matricula));

            Id = id;
            Nome = nome;
            Matricula = matricula;
        }

        public Membro() {}
    }
}