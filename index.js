import express from "express"
import cors from 'cors';
import fs from "fs"

const app = express()
const port = 3001

// Middleware para processar JSON no corpo da requisição
app.use(express.json())
app.use(cors());

// Rota para pesquisar jogadores pelo nome
app.post("/search", (req, res) => {
  const query = req.body.q?.toLowerCase(); // Obtém o parâmetro 'q' do corpo da requisição e converte para minúsculas

  if (!query) {
    return res.status(400).json({ error: "Por favor, forneça um parâmetro 'q' no corpo da requisição." });
  }

  // Lê o arquivo JSON com os dados dos jogadores
  fs.readFile("data-players.json", "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Erro ao ler o arquivo de dados." });
    }

    try {
      const players = JSON.parse(data); // Converte o JSON para um objeto JavaScript
      const results = players.filter(player =>
        player.nome.toLowerCase().includes(query) // Filtra jogadores cujo nome contém o termo de busca
      );

      if (results.length === 0) {
        return res.status(404).json({ message: "Nenhum jogador encontrado." });
      }

      // Atualiza o histórico
      const historyEntry = results.map(player => ({
        id: player.id || null, // Garante que o ID seja salvo (se existir no JSON original)
        nome: player.nome,
        time: player.equipe // Usando 'localizacao' como exemplo de time
      }));

      fs.readFile("history.json", "utf8", (historyErr, historyData) => {
        let history = [];

        if (!historyErr && historyData) {
          history = JSON.parse(historyData);
        }

        // Adiciona apenas entradas que ainda não estão no histórico
        historyEntry.forEach(entry => {
          const exists = history.some(item => item.nome === entry.nome && item.time === entry.time);
          if (!exists) {
            history.unshift(entry); // Adiciona no início do array
          }
        });

        // Mantém apenas os 5 mais recentes
        history = history.slice(0, 5);

        // Salva o histórico atualizado
        fs.writeFile("history.json", JSON.stringify(history, null, 2), writeErr => {
          if (writeErr) {
            console.error("Erro ao salvar o histórico:", writeErr);
          }
        });
      });

      res.json(results); // Retorna os jogadores encontrados
    } catch (parseError) {
      res.status(500).json({ error: "Erro ao processar os dados do arquivo." });
    }
  });
})

// Rota para retornar o histórico de pesquisas
app.get("/history", (req, res) => {
  fs.readFile("history.json", "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Erro ao ler o arquivo de histórico." })
    }

    try {
      const history = JSON.parse(data)
      res.json(history) // Retorna o histórico
    } catch (parseError) {
      res.status(500).json({ error: "Erro ao processar o arquivo de histórico." })
    }
  })
})

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`)
})