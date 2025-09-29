import express from "express";
import cors from "cors";
import morgan from "morgan";
import { v4 as uuidv4 } from "uuid";
import methodOverride from "method-override";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import fetch from "node-fetch";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================= MIDDLEWARES ================= //
app.use(cors()); // 🔥 Permite que tu frontend acceda al backend
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// Servir archivos estáticos (frontend en /public)
app.use(express.static(path.join(__dirname, "../public")));

// ================= BASE DE DATOS ================= //
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "digimon_api",
});

// Helper para obtener imagen desde la API pública
const getDigimonImage = async (nombre) => {
  try {
    const res = await fetch(
      `https://digimon.shadowsmith.com/api/digimon/name/${nombre.toLowerCase()}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data[0]?.img || null;
  } catch {
    return null;
  }
};

// ======================= RUTAS ======================= //

// GET todos los Digimon
app.get("/digimons", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM digimons");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET por id
app.get("/digimons/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM digimons WHERE id = ?", [
      req.params.id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Digimon no encontrado" });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST nuevo digimon
app.post("/digimons", async (req, res) => {
  try {
    const { nombre, tipo, nivel } = req.body;

    if (!nombre || !tipo || nivel == null) {
      return res
        .status(400)
        .json({ error: "Todos los campos son requeridos" });
    }

    const nivelNum = Number(nivel);
    if (Number.isNaN(nivelNum)) {
      return res.status(400).json({ error: "nivel debe ser numérico" });
    }

    const id = uuidv4();
    const version = 1;

    const imagen = await getDigimonImage(nombre);

    await pool.query(
      "INSERT INTO digimons (id, nombre, tipo, nivel, version, imagen) VALUES (?, ?, ?, ?, ?, ?)",
      [id, nombre, tipo, nivelNum, version, imagen]
    );

    res.status(201).json({
      id,
      nombre,
      tipo,
      nivel: nivelNum,
      version,
      imagen,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT actualizar digimon
app.put("/digimons/:id", async (req, res) => {
  try {
    const { nombre, tipo, nivel } = req.body;

    const [rows] = await pool.query("SELECT * FROM digimons WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Digimon no encontrado" });
    }

    const d = rows[0];
    const newNombre = nombre || d.nombre;
    const newTipo = tipo || d.tipo;
    const newNivel = nivel != null ? Number(nivel) : d.nivel;
    if (nivel != null && Number.isNaN(newNivel)) {
      return res.status(400).json({ error: "nivel debe ser numérico" });
    }

    const newVersion = d.version + 1;
    const newImagen = await getDigimonImage(newNombre);

    await pool.query(
      "UPDATE digimons SET nombre=?, tipo=?, nivel=?, version=?, imagen=? WHERE id=?",
      [newNombre, newTipo, newNivel, newVersion, newImagen, req.params.id]
    );

    res.json({
      id: req.params.id,
      nombre: newNombre,
      tipo: newTipo,
      nivel: newNivel,
      version: newVersion,
      imagen: newImagen,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE digimon
app.delete("/digimons/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM digimons WHERE id = ?", [
      req.params.id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Digimon no encontrado" });
    }
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ======================= SERVIDOR ======================= //
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
);
