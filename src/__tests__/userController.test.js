import { jest } from '@jest/globals';
import * as db from '../config/db.js';

jest.mock('../config/db.js');

describe('loginUser', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {} // sin email ni password
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    db.pool.request = jest.fn().mockReturnThis();
    db.pool.request().query = jest.fn();
  });

  test('debe responder 400 si faltan datos', async () => {
    const { loginUser } = await import('../controllers/userController.js');
    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'email y contraseña son obligatorios' });
  });
});
