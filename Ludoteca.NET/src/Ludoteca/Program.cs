using Ludoteca.Services;

class Program
{
    // Instancia o serviço que contém toda a lógica da aplicação
    private static readonly BibliotecaService _bibliotecaService = new BibliotecaService();

    static void Main(string[] args)
    {
        bool sair = false;
        while (!sair)
        {
            ExibirMenu();
            string? opcao = Console.ReadLine();

            try
            {
                switch (opcao)
                {
                    case "1":
                        CadastrarNovoJogo();
                        break;
                    case "2":
                        CadastrarNovoMembro();
                        break;
                    case "3":
                        ListarTodosJogos();
                        break;
                    case "4":
                        RealizarEmprestimo();
                        break;
                    case "5":
                        RealizarDevolucao();
                        break;
                    // ===== TRECHO MODIFICADO =====
                    case "6":
                        GerarNovoRelatorio();
                        break;
                    // =============================
                    case "0":
                        sair = true;
                        _bibliotecaService.SalvarDados();
                        Console.WriteLine("\nDados salvos. Até logo!");
                        break;
                    default:
                        Console.WriteLine("\nOpção inválida. Tente novamente.");
                        break;
                }
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"\n❌ ERRO: {ex.Message}");
                Console.ResetColor();
                _bibliotecaService.LogException(ex);
            }

            if (!sair)
            {
                Console.WriteLine("\nPressione qualquer tecla para continuar...");
                Console.ReadKey();
            }
        }
    }

    private static void ExibirMenu()
    {
        Console.Clear();
        Console.WriteLine("=== LUDOTECA .NET ===");
        Console.WriteLine("1. Cadastrar jogo");
        Console.WriteLine("2. Cadastrar membro");
        Console.WriteLine("3. Listar jogos");
        Console.WriteLine("4. Emprestar jogo");
        Console.WriteLine("5. Devolver jogo");
        Console.WriteLine("6. Gerar relatório");
        Console.WriteLine("0. Sair");
        Console.Write("Escolha uma opção: ");
    }

    private static void CadastrarNovoJogo()
    {
        Console.WriteLine("\n--- Cadastro de Jogo ---");
        Console.Write("Nome do jogo: ");
        string nome = Console.ReadLine() ?? "";
        Console.Write("Ano de lançamento: ");
        int ano = Convert.ToInt32(Console.ReadLine());

        _bibliotecaService.CadastrarJogo(nome, ano);
    }
    
    private static void CadastrarNovoMembro()
    {
        Console.WriteLine("\n--- Cadastro de Membro ---");
        Console.Write("Nome do membro: ");
        string nome = Console.ReadLine() ?? "";
        Console.Write("Matrícula: ");
        string matricula = Console.ReadLine() ?? "";

        _bibliotecaService.CadastrarMembro(nome, matricula);
    }
    
    private static void ListarTodosJogos()
    {
        Console.WriteLine("\n--- Lista de Jogos ---");
        var jogos = _bibliotecaService.ListarJogos();
        if (!jogos.Any())
        {
            Console.WriteLine("Nenhum jogo cadastrado.");
            return;
        }

        foreach (var jogo in jogos)
        {
            string status = jogo.Disponivel ? "Disponível" : "Emprestado";
            Console.WriteLine($"ID: {jogo.Id} | Nome: {jogo.Nome} ({jogo.AnoLancamento}) | Status: {status}");
        }
    }
    
    private static void RealizarEmprestimo()
    {
        Console.WriteLine("\n--- Emprestar Jogo ---");
        Console.Write("Digite o ID do jogo a ser emprestado: ");
        int jogoId = Convert.ToInt32(Console.ReadLine());
        Console.Write("Digite o ID do membro que está pegando o jogo: ");
        int membroId = Convert.ToInt32(Console.ReadLine());
        
        _bibliotecaService.EmprestarJogo(jogoId, membroId);
    }
    
    private static void RealizarDevolucao()
    {
        Console.WriteLine("\n--- Devolver Jogo ---");
        Console.Write("Digite o ID do jogo a ser devolvido: ");
        int jogoId = Convert.ToInt32(Console.ReadLine());
        
        _bibliotecaService.DevolverJogo(jogoId);
    }

    // ===== NOVO MÉTODO ADICIONADO =====
    private static void GerarNovoRelatorio()
    {
        Console.WriteLine("\n--- Gerando Relatório ---");
        var relatorioService = new RelatorioService();
        // O relatório será salvo na pasta onde o executável está rodando
        string caminhoRelatorio = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "relatorio.txt");

        // Passamos os dados do serviço principal para o serviço de relatório
        relatorioService.GerarRelatorio(_bibliotecaService.Dados, caminhoRelatorio);

        Console.WriteLine($"\n✅ Relatório gerado com sucesso! Verifique o arquivo 'relatorio.txt'.");
    }
    // ===================================
}