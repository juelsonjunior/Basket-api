import express from "express";
import cors from "cors";
import mongoose from "mongoose";

const app = express();
const port = 3001;

// Middleware para processar JSON no corpo da requisição
app.use(express.json());
app.use(cors());

// Conexão com o MongoDB Atlas
mongoose
  .connect(
    "mongodb+srv://juelsonjunior27:YVXFBWkxn5r4tr3r@basketdata.rc2juvg.mongodb.net/basketData?retryWrites=true&w=majority"
  )
  .then(() => console.log("Conectado ao MongoDB Atlas"))
  .catch((error) => console.error("Erro ao conectar ao MongoDB Atlas:", error));

// Modelo de jogador
const PlayerSchema = new mongoose.Schema({
  nome: String,
  idade: Number,
  localizacao: String,
  equipe: String,
  hobbies: [String],
  historia: String,
  conquistas: [String],
});

const Player = mongoose.model("Player", PlayerSchema, "players"); // Define a coleção como "players"

// Modelo de histórico
const HistorySchema = new mongoose.Schema({
  id: Number,
  nome: String,
  equipe: String,
  userId: String,
});

const History = mongoose.model("History", HistorySchema, "history"); // Define a coleção como "history"

// Rota para pesquisar jogadores pelo nome
app.post("/search", async (req, res) => {
  const query = req.body.q?.toLowerCase();

  if (!query) {
    return res.status(400).json({
      error: "Por favor, forneça um parâmetro 'q' no corpo da requisição.",
    });
  }

  try {
    // Busca os jogadores no banco de dados
    const players = await Player.find({
      nome: { $regex: query, $options: "i" },
    });

    if (players.length === 0) {
      return res.status(404).json({ message: "Nenhum jogador encontrado." });
    }

    res.json(players); // Retorna os jogadores encontrados
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para salvar o histórico explicitamente
app.post("/save-history", async (req, res) => {
  const { players, userId } = req.body; // Recebe o userId no corpo da requisição

  if (!players || players.length === 0) {
    return res
      .status(400)
      .json({ error: "Nenhum jogador fornecido para salvar no histórico." });
  }

  if (!userId) {
    return res
      .status(400)
      .json({ error: "O campo 'userId' é obrigatório." });
  }

  try {
    // Adiciona os jogadores ao histórico, evitando duplicados
    for (const player of players) {
      const exists = await History.findOne({
        id: player.id, // Verifica duplicados pelo mesmo id do jogador
        userId: userId, // Verifica duplicados por usuário
      });

      if (!exists) {
        await History.create({
          id: player.id,
          nome: player.nome,
          equipe: player.equipe,
          userId: userId, // Salva o userId
        });
      }
    }

    res.json({ message: "Histórico salvo com sucesso." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para retornar o histórico de pesquisas
app.get("/history", async (req, res) => {
  try {
    const history = await History.find();
    res.json(history); // Retorna todo o histórico
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para adicionar um novo jogador
app.post("/players", async (req, res) => {
  const { nome, idade, localizacao, equipe, hobbies, historia, conquistas } =
    req.body;

  if (!nome || !idade || !localizacao || !equipe) {
    return res.status(400).json({
      error:
        "Os campos 'nome', 'idade', 'localizacao' e 'equipe' são obrigatórios.",
    });
  }

  try {
    const newPlayer = new Player({
      nome,
      idade,
      localizacao,
      equipe,
      hobbies: hobbies || [],
      historia: historia || "",
      conquistas: conquistas || [],
    });

    const savedPlayer = await newPlayer.save();
    res.status(201).json(savedPlayer); // Retorna o jogador salvo
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para editar dados de um jogador
app.put("/players/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const updatedPlayer = await Player.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!updatedPlayer) {
      return res.status(404).json({ message: "Jogador não encontrado." });
    }

    res.json(updatedPlayer); // Retorna o jogador atualizado
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para listar todos os jogadores
app.get("/players", async (req, res) => {
  try {
    const players = await Player.find();
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para eliminar um jogador
app.delete("/players/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedPlayer = await Player.findByIdAndDelete(id);
    
    if (!deletedPlayer) {
      return res.status(404).json({ message: "Jogador não encontrado." });
    }

    res.json({ message: "Jogador eliminado com sucesso." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
