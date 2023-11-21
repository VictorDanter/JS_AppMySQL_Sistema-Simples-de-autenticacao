const express = require('express');
const mysql = require('mysql');
const session = require('express-session');
const app = express();
const port = 3000;

// Configuração do servidor Express
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); 
// Servir arquivos estáticos, como CSS e imagens.

// Configuração da conexão com o banco de dados MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: ''
});

db.connect((err) => {
    if (err) {
        console.error('Erro na conexão com o banco de dados:', err);
        return;
    }
    console.log('Conectado ao banco de dados MySQL');
});

// Configuração de sessões para autenticação
app.use(session({
    secret: 'chave_secreta',
    resave: false,
    saveUninitialized: true
}));

// Rota para servir o formulário de login
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Rota para processar o login
app.post('/login', (req, res) => {
    const matricula = req.body.matricula;
    const senha = req.body.senha;

    // Consulta ao banco de dados para verificar a autenticação
    const sql = 'SELECT * FROM acessousuario WHERE matricula = ? AND senha = ?';
    db.query(sql, [matricula, senha], (err, results) => {
        if (err || results.length === 0) {
            res.send('Autenticação falhou. Verifique a matrícula e a senha.');
        } else {
            req.session.autenticado = true;
            res.redirect('/home');
        }
    });
});

// Rota para a página principal (apenas para usuários autenticados)
app.get('/home', (req, res) => {
    if (req.session.autenticado) {
        res.sendFile(__dirname + '/pagina_principal.html');
    } else {
        res.redirect('/');
    }
});

//Rota para A Aba de adicionar funcionarios.
app.get('/funcionarios', (req, res) => {
    if (req.session.autenticado) {
        // Consulta ao banco de dados para obter a lista de departamentos
        db.query('SELECT * FROM departamentos', (err, departamentos) => {
            if (err) throw err;

            // Recuperar a lista de funcionários com informações do departamento
            db.query('SELECT f.*, d.Nome AS NomeDoDepartamento FROM funcionarios f JOIN departamentos d ON f.DepartamentoID = d.ID', (err, funcionarios) => {
                if (err) throw err;
                
                // Agora, você pode enviar a resposta após obter as informações necessárias do banco de dados
                res.sendFile(__dirname + '/funcionarios.html');
            });
        });
    } else {
        res.redirect('/');
    }
});


    
app.post('/add', (req, res) =>{
    const {nome, dataNascimento, dataContratacao, Cargo, salario, departamento, CPF} = req.body;
    //inserir um novo user
    const sql = 'INSERT INTO funcionarios (Nome, DataDeNascimento, DataDeContratacao, Cargo, Salario, DepartamentoID, CPF) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [nome, dataNascimento, dataContratacao, Cargo, salario, departamento, CPF], (err) => {
        if (err) throw err;
        res.redirect('/funcionarios');
    });
});

app.delete('/delete/:id', (req, res) => {
    const userId = req.params.id;

    // SQL para deletar o usuário com base no ID
    const sql = 'DELETE FROM funcionarios WHERE ID = ?';

    // Execute a consulta SQL para excluir o funcionário
    db.query(sql, [userId], (err, result) => {
        if (err) {
            console.error('Erro ao excluir usuário:', err);
            res.status(500).send('Erro ao excluir usuário');
        } else {
            if (result.affectedRows > 0) {
                res.status(200).send('Usuário excluído com sucesso!');
            } else {
                res.status(404).send('Usuário não encontrado');
            }
        }
    });
});

app.get('/api/funcionarios', (req, res) => {
    const limit = req.query.limit || 5; // Limite de funcionários por página (padrão: 5)
    const offset = req.query.offset || 0; // Deslocamento (padrão: 0)

    const sql = `SELECT f.*, d.Nome AS NomeDoDepartamento FROM funcionarios f JOIN departamentos d ON f.DepartamentoID = d.ID LIMIT ${limit} OFFSET ${offset}`;

    db.query(sql, (err, funcionarios) => {
        if (err) {
            console.error('Erro ao buscar dados dos funcionários:', err);
            res.status(500).send('Erro ao buscar dados dos funcionários');
        } else {
            res.json(funcionarios);
        }
    });
});




app.get('/api/departamentos', (req, res) => {
    // Consulta ao banco de dados para obter a lista de departamentos
    db.query('SELECT * FROM departamentos', (err, departamentos) => {
        if (err) throw err;
        res.json(departamentos);
    });
});



// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor em execução em http://localhost:${port}`);
});
