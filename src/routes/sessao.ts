import express from 'express';
import { iniciarSessaoRemota } from '../browserlessSession.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { url } = req.body;

  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ message: 'URL inválida' });
  }

  try {
    const html = await iniciarSessaoRemota(url);
    if (html) {
      return res.status(200).json({ html });
    } else {
      return res.status(500).json({ message: 'Erro ao renderizar página' });
    }
  } catch (err) {
    return res.status(500).json({ message: 'Erro inesperado', error: err });
  }
});

export default router;
