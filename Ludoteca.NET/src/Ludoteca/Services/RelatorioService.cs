using Ludoteca.Models;
using System.Text;

namespace Ludoteca.Services
{
    public class RelatorioService
    {
        public void GerarRelatorio(BibliotecaData data, string caminhoArquivo)
        {
            try
            {
                // 1. Calcular as estatísticas
                int totalJogos = data.Jogos.Count;
                int totalMembros = data.Membros.Count;
                int emprestimosAtivos = data.Emprestimos.Count(e => e.DataDevolucaoReal == null);
                
                // Para este cálculo, consideramos "em atraso" os empréstimos ativos cuja data de devolução prevista já passou.
                int devolucoesEmAtraso = data.Emprestimos.Count(e => 
                    e.DataDevolucaoReal == null && 
                    e.DataDevolucaoPrevista.Date < DateTime.Now.Date);

                // Placeholder para a lógica de multas. Aqui, apenas contamos os atrasados.
                decimal multasCobradas = devolucoesEmAtraso * 5.00m; // Ex: R$ 5,00 por atraso

                // 2. Montar o conteúdo do relatório usando StringBuilder
                var sb = new StringBuilder();
                sb.AppendLine("========================================");
                sb.AppendLine("       RELATÓRIO DA LUDOTECA .NET       ");
                sb.AppendLine("========================================");
                sb.AppendLine($"Data de Geração: {DateTime.Now:dd/MM/yyyy HH:mm:ss}");
                sb.AppendLine("----------------------------------------");
                sb.AppendLine($"  Total de Jogos Cadastrados: {totalJogos}");
                sb.AppendLine($"  Total de Membros Ativos: {totalMembros}");
                sb.AppendLine("----------------------------------------");
                sb.AppendLine($"  Empréstimos Ativos no Momento: {emprestimosAtivos}");
                sb.AppendLine($"  Devoluções em Atraso: {devolucoesEmAtraso}");
                sb.AppendLine($"  Valor Total em Multas (Estimado): R$ {multasCobradas:F2}");
                sb.AppendLine("========================================");

                // 3. Salvar o conteúdo no arquivo de texto
                File.WriteAllText(caminhoArquivo, sb.ToString());
            }
            catch (Exception ex)
            {
                Console.WriteLine($"\n❌ Ocorreu um erro ao gerar o relatório: {ex.Message}");
            }
        }
    }
}