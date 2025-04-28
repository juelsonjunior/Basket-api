import express from "express";
import cors from "cors";
import fs from "fs/promises"; // Usando a versão de Promises do fs para simplificar o código

const app = express();
const port = 3001;

// Middleware para processar JSON no corpo da requisição
app.use(express.json());
app.use(cors());

// Função auxiliar para ler arquivos JSON
const readJsonFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`Erro ao ler o arquivo ${filePath}: ${error.message}`);
  }
};

// Função auxiliar para escrever arquivos JSON
const writeJsonFile = async (filePath, data) => {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    throw new Error(`Erro ao escrever no arquivo ${filePath}: ${error.message}`);
  }
};

// Rota para pesquisar jogadores pelo nome
app.post("/search", async (req, res) => {
  const query = req.body.q?.toLowerCase();

  if (!query) {
    return res.status(400).json({ error: "Por favor, forneça um parâmetro 'q' no corpo da requisição." });
  }

  try {
    // Lê os dados dos jogadores
    const players = await readJsonFile("data-players.json");

    // Filtra os jogadores pelo nome
    const results = players.filter((player) =>
      player.nome.toLowerCase().includes(query)
    );

    if (results.length === 0) {
      return res.status(404).json({ message: "Nenhum jogador encontrado." });
    }

    // Atualiza o histórico
    const historyEntry = results.map((player) => ({
      id: player.id || null,
      nome: player.nome,
      equipe: player.equipe,
       // Aqui está o problema: está usando "time" em vez de "equipe"
    }));

    // Lê e atualiza o histórico
    let history = [];
    try {
      history = await readJsonFile("history.json");
    } catch {
      // Se o arquivo não existir ou estiver vazio, inicializa o histórico como um array vazio
      history = [];
    }

    // Adiciona apenas entradas que ainda não estão no histórico
    historyEntry.forEach((entry) => {
      const exists = history.some(
        (item) => item.nome === entry.nome && item.equipe === entry.equipe
      );
      if (!exists) {
        history.unshift(entry); // Adiciona no início do array
      }
    });

    // Salva o histórico atualizado
    await writeJsonFile("history.json", history);

    res.json(results); // Retorna os jogadores encontrados
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para retornar o histórico de pesquisas
app.get("/history", async (req, res) => {
  try {
    const history = await readJsonFile("history.json");
    res.json(history); // Retorna todo o histórico
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});