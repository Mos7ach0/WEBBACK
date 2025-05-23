import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool, poolConnect } from '../config/db.js';

// Login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email y contraseña son obligatorios" });
    }

    await poolConnect;
    const request = pool.request();

    const result = await request
      .input('email', email)
      .query('SELECT * FROM dbo.usersEsquivel WHERE email = @email');

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    const user = result.recordset[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login exitoso",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error en el servidor al procesar login" });
  }
};

// Obtener todos los usuarios
export const getUsers = async (req, res) => {
  try {
    await poolConnect;
    const request = pool.request();
    const result = await request.query('SELECT id, name, email FROM dbo.usersEsquivel');
    res.json(result.recordset);
  } catch (error) {
    console.error("Error en getUsers:", error);
    res.status(500).json({ message: error.message });
  }
};

// Obtener usuario por ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    await poolConnect;
    const request = pool.request();
    const result = await request
      .input('id', id)
      .query('SELECT id, name, email FROM dbo.usersEsquivel WHERE id = @id');

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error("Error en getUserById:", error);
    res.status(500).json({ message: error.message });
  }
};

// Crear usuario
export const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!password) return res.status(400).json({ message: "La contraseña es obligatoria" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await poolConnect;
    const request = pool.request();

    await request
      .input('name', name)
      .input('email', email)
      .input('password', hashedPassword)
      .query('INSERT INTO dbo.usersEsquivel (name, email, password) VALUES (@name, @email, @password)');

    res.status(201).json({ message: "Usuario creado exitosamente" });
  } catch (error) {
    console.error("Error en createUser:", error);
    res.status(500).json({ message: error.message });
  }
};

// Actualizar usuario
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;

    await poolConnect;
    const request = pool.request();

    let result = await request
      .input('id', id)
      .query('SELECT * FROM dbo.usersEsquivel WHERE id = @id');

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    let hashedPassword = result.recordset[0].password;
    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    await pool.request()
      .input('name', name)
      .input('email', email)
      .input('password', hashedPassword)
      .input('id', id)
      .query(`UPDATE dbo.usersEsquivel SET name = @name, email = @email, password = @password WHERE id = @id`);

    res.json({ message: "Usuario actualizado correctamente" });
  } catch (error) {
    console.error("Error en updateUser:", error);
    res.status(500).json({ message: error.message });
  }
};

// Eliminar usuario
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    await poolConnect;
    const request = pool.request();

    let result = await request
      .input('id', id)
      .query('SELECT * FROM dbo.usersEsquivel WHERE id = @id');

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    await pool.request()
      .input('id', id)
      .query('DELETE FROM dbo.usersEsquivel WHERE id = @id');

    res.json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error("Error en deleteUser:", error);
    res.status(500).json({ message: error.message });
  }
};
