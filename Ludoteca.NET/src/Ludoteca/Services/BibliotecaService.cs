// Local: /Services/BibliotecaService.cs
using Ludoteca.Models;
using System.Diagnostics;
using System.Text.Json;
using System.Text.Encodings.Web;
using System.Text.Unicode;

namespace Ludoteca.Services
{
    public class BibliotecaService
    {
        private BibliotecaData _data = new BibliotecaData();
        
        // LINHA ADICIONADA: Propriedade pública para expor os dados para leitura
        public BibliotecaData Dados => _data; 
        
        private readonly string _dataDirectory = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "data");
        private readonly string _filePath;
        private readonly string _logPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "debug.log");

        public BibliotecaService()
        {
            _filePath = Path.Combine(_dataDirectory, "biblioteca.json");
            CarregarDados();
        }

        public void CadastrarJogo(string nome, int ano)
        {
            int novoId = _data.Jogos.Any() ? _data.Jogos.Max(j => j.Id) + 1 : 1;
            var novoJogo = new Jogo(novoId, nome, ano);
            _data.Jogos.Add(novoJogo);
            Console.WriteLine($"✅ Jogo '{nome}' cadastrado com sucesso!");
        }

        public void CadastrarMembro(string nome, string matricula)
        {
            if (_data.Membros.Any(m => m.Matricula.Equals(matricula, StringComparison.OrdinalIgnoreCase)))
            {
                throw new InvalidOperationException("Já existe um membro com esta matrícula.");
            }
            int novoId = _data.Membros.Any() ? _data.Membros.Max(m => m.Id) + 1 : 1;
            var novoMembro = new Membro(novoId, nome, matricula);
            _data.Membros.Add(novoMembro);
            Console.WriteLine($"✅ Membro '{nome}' cadastrado com sucesso!");
        }

        public IReadOnlyList<Jogo> ListarJogos()
        {
            return _data.Jogos.AsReadOnly();
        }

        public void EmprestarJogo(int jogoId, int membroId)
        {
            var jogo = _data.Jogos.FirstOrDefault(j => j.Id == jogoId);
            if (jogo == null)
                throw new ArgumentException("Jogo não encontrado com o ID informado.");

            var membro = _data.Membros.FirstOrDefault(m => m.Id == membroId);
            if (membro == null)
                throw new ArgumentException("Membro não encontrado com o ID informado.");

            Debug.Assert(jogo.Disponivel, "Tentativa de emprestar um jogo marcado como indisponível.");

            if (!jogo.Disponivel)
                throw new InvalidOperationException("Este jogo já está emprestado.");

            jogo.Disponivel = false;
            int novoId = _data.Emprestimos.Any() ? _data.Emprestimos.Max(e => e.Id) + 1 : 1;
            var novoEmprestimo = new Emprestimo(novoId, jogoId, membroId);
            _data.Emprestimos.Add(novoEmprestimo);

            Console.WriteLine($"✅ Jogo '{jogo.Nome}' emprestado para '{membro.Nome}'. Devolver até: {novoEmprestimo.DataDevolucaoPrevista:dd/MM/yyyy}");
        }

        public void DevolverJogo(int jogoId)
        {
            var emprestimoAtivo = _data.Emprestimos.FirstOrDefault(e => e.JogoId == jogoId && e.DataDevolucaoReal == null);
            if (emprestimoAtivo == null)
                throw new InvalidOperationException("Este jogo não consta como emprestado.");

            var jogo = _data.Jogos.FirstOrDefault(j => j.Id == jogoId);
            Debug.Assert(jogo != null, "Empréstimo ativo para um jogo que não existe no catálogo.");
            Debug.Assert(!jogo.Disponivel, "Empréstimo ativo para um jogo marcado como disponível.");

            if(jogo != null)
            {
                jogo.Disponivel = true;
                emprestimoAtivo.DataDevolucaoReal = DateTime.Now;

                TimeSpan atraso = emprestimoAtivo.DataDevolucaoReal.Value - emprestimoAtivo.DataDevolucaoPrevista;
                if (atraso.Days > 0)
                {
                    Console.WriteLine($"🚨 ATENÇÃO: Devolução com {atraso.Days} dia(s) de atraso. Multa a ser calculada.");
                }
                
                Console.WriteLine($"✅ Jogo '{jogo.Nome}' devolvido com sucesso.");
            }
        }

        public void SalvarDados()
        {
            try
            {
                Directory.CreateDirectory(_dataDirectory);
                var options = new JsonSerializerOptions
                {
                    WriteIndented = true,
                    Encoder = JavaScriptEncoder.Create(UnicodeRanges.All)
                };
                string jsonString = JsonSerializer.Serialize(_data, options);
                File.WriteAllText(_filePath, jsonString);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Erro ao salvar os dados: {ex.Message}");
                LogException(ex);
            }
        }

        private void CarregarDados()
        {
            try
            {
                if (File.Exists(_filePath))
                {
                    string jsonString = File.ReadAllText(_filePath);
                    var data = JsonSerializer.Deserialize<BibliotecaData>(jsonString);
                    if (data != null)
                    {
                        _data = data;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Erro ao carregar os dados: {ex.Message}. Começando com uma base nova.");
                LogException(ex);
                _data = new BibliotecaData();
            }
        }

        public void LogException(Exception ex)
        {
            string logMessage = $"{DateTime.Now:G} - ERRO: {ex.GetType().Name} - {ex.Message}\nStackTrace: {ex.StackTrace}\n\n";
            File.AppendAllText(_logPath, logMessage);
        }
    }
}