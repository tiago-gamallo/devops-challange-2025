const express = require('express');
const client = require('prom-client');

const app = express();
const port = process.env.PORT || 3000;

// =====================
// Prometheus Metrics
// =====================
client.collectDefaultMetrics();

const requestsTotal = new client.Counter({
  name: 'app2_requests_total',
  help: 'Total de requisições no app2'
});

app.use((req, res, next) => {
  // Boa prática: não contar as chamadas do próprio Prometheus para não sujar os dados de tráfego real
  if (req.path !== '/metrics') {
    requestsTotal.inc();
  }
  next();
});

// =====================
// Rotas
// =====================
app.get('/', (req, res) => {
  res.send('Aplicação 2 - Node.js');
});

app.get('/time', (req, res) => {
  // O cache de 1 minuto será gerenciado pela camada de infraestrutura (Nginx)
  const now = new Date().toISOString();
  res.send(`Horário atual (App2): ${now}`);
});

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

const server = app.listen(port, () => {
  console.log(`App2 rodando na porta ${port}`);
});

// =====================
// Graceful Shutdown
// =====================
const gracefulShutdown = (signal) => {
  console.log(`\nRecebido sinal ${signal}, iniciando encerramento gracioso...`);
  
  server.close(() => {
    console.log('Servidor HTTP encerrado com sucesso. Nenhuma nova conexão será aceita.');
    process.exit(0);
  });

  // Fallback de segurança: força o encerramento se as conexões demorarem muito para fechar
  setTimeout(() => {
    console.error('Forçando encerramento após 10 segundos...');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));