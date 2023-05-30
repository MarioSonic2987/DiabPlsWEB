const http = require("http");

const host = 'localhost';
const port = 8000;

const bodyParser = require('body-parser');
const express = require('express');
const session = require('express-session');
var flash = require('express-flash-messages');
const fs = require('fs');
const dotenv = require('dotenv');

var app = express();
dotenv.config({ path: './.env' })
var $ = require('jquery');

// Defining key
const secretoProhibido = 'GfG';

const crypto = require('crypto');

var mysql = require('mysql');
const req = require("express/lib/request");

var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "diabpls",
    multipleStatements: true
});



app.use(session({
    secret: 'GfG',
    saveUninitialized: true,
    resave: true
}));


app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(flash());

app.set('view engine', 'ejs');

app.use(function (req, res, next) {
    res.locals.message = req.flash();
    next();
});

app.get('/download', function(req, res){
    const file = `./backups/backup_${req.session.username}.txt`;
    res.download(file); // Set disposition and send it.
  })

app.get('/home', function (req, res) {
    console.log(req.session.loggedin);
    if (req.session.loggedin) {
        let query;
        if (req.session.rol == "Administrador") {
            query = `select u.nombre, u.apellidos, u.dni, d.fecha_hora, d.glucosa, d.sensibilidad, d.hidratos, d.insulina, d.comentario from usuarios u, datos_pacientes d where u.id_usuario = d.id_paciente`;
        } else {
            query = `select u.nombre, u.apellidos, u.dni, d.fecha_hora, d.glucosa, d.sensibilidad, d.hidratos, d.insulina, d.comentario from usuarios u, datos_pacientes d where u.id_usuario = d.id_paciente and u.nombre_usuario = '${req.session.username}'`;
        }


        connection.query(query, (err, results) => {
            if (err) {
                console.log(err.message);
            }

            try {
                fs.writeFileSync(`./backups/backup_${req.session.username}.txt`, JSON.stringify(results),{ flag: 'w+' });
                // file written successfully
              } catch (err) {
                console.error(err);
              }

            // Output username
            res.render('index.ejs', { title: 'Registro de datos', results: results, user: req.session.username, rol: req.session.rol });

        });
    } else {
        res.redirect("/login");
    }

});

app.get('/insert_data', function (req, res) {
    console.log(req.session.loggedin);
    if (req.session.loggedin) {

        let query;
        if (req.session.rol == "Administrador") {
            query = `select * from usuarios where rol = "Paciente"`;
        } else {
            query = `select * from usuarios where nombre_usuario = '${req.session.username}'`;
        }

        connection.query(query, (err, results) => {
            if (err) {
                console.log(err.message);
            }

            res.render('insert_data.ejs', { title: 'Insertar datos', results: results, user: req.session.username, rol: req.session.rol });
        });

    } else {
        res.redirect("/login");
    }

});

app.post('/insert_data', function (req, res) {
    const uri = "/insert_data";

    const limbo_gluc = 100;

    const id_paciente = req.body.id_paciente;
    const glucosa = req.body.glucosa;
    const hidratos = req.body.hidratos;
    const sensibilidad = req.body.sensibilidad;
    const ratio_insulina = req.body.insulina;
    const comentario = req.body.comentario;

    let res1 = 0;

    let resFinal;

    res1 = Math.round((glucosa - limbo_gluc) / sensibilidad);

    resFinal = hidratos * ratio_insulina;

    console.log(res1 + " - " + resFinal);

    let insulina_pinchar = (parseFloat(res1) + parseFloat(resFinal));

    console.log(insulina_pinchar);

    let query = `insert into datos_pacientes (id_paciente, sensibilidad, glucosa, hidratos, insulina, comentario) 
    values (${id_paciente}, ${sensibilidad}, ${glucosa}, ${parseFloat(hidratos)}, ${insulina_pinchar}, '${comentario}')`;

    connection.query(query, (err, results) => {
        if (err) {
            console.log(err.message);
            req.flash("error", err.message);
            req.flash("sensibilidad", sensibilidad);
            req.flash("glucosa", glucosa);
            req.flash("hidratos", hidratos);
            req.flash("insulina", ratio_insulina);
            req.flash("comentario", comentario);
            return res.redirect(uri);
        }
        console.log('Row inserted:' + results.affectedRows);
        req.flash("exito", "Datos insertados correctamente");
        return res.redirect(uri);

    });


});

app.get('/', function (req, res) {
    req.session.loggedin = false;
    res.redirect('/login');
});

app.get('/login', function (req, res) {
    req.session.loggedin = false;
    const query = `select * from usuarios`;
    connection.query(query, (err, results) => {
        if (err) {
            console.log(err.message);
        }

        res.render('login.ejs', { title: 'Iniciar sesión', results: results });
    });

});

app.post('/login', function (req, res) {
    const uri = "/login"
    const usuario = req.body.id_usuario;
    const passwd = req.body.password;
    let password = crypto.createHmac('sha256', secretoProhibido).update(passwd).digest('hex');

    const query = `SELECT * FROM usuarios WHERE nombre_usuario = '${usuario}' AND password = '${password}'`;

    if (usuario && password) {
        console.log(query);
        connection.query(query, (err, results) => {
            if (err) {
                console.log(err);
                return res.redirect(uri);
            }
            // If the account exists
            if (results.length > 0) {
                // Authenticate the user
                req.session.loggedin = true;
                req.session.username = usuario;
                req.session.rol = results[0].rol;
                console.log(req.session.rol);
                console.log(req.session.username);
                // Redirect to home page
                return res.redirect("/home");
            } else {
                req.flash("error", "Nombre de usuario/Contraseña inválido");
                console.log("Nombre de usuario/Contraseña inválido");
                return res.redirect(uri);
            }
        });
    }
});

app.get('/create_user', function (req, res) {
    console.log(req.session.loggedin);
    if (req.session.loggedin) {

        if (req.session.rol == "Administrador") {


            res.render('create_user.ejs', { title: 'Crear usuario', user: 'Dogs rock!', user: req.session.username, rol: req.session.rol });
        }
    } else {
        res.redirect("/login");
    }
});


app.post('/create_user', function (req, res) {
    const uri = "/create_user";

    const nombre_real = req.body.nombre_real;
    const apellidos = req.body.apellidos;
    const username = req.body.username;
    const password = req.body.password;
    const password_repe = req.body.password_repe;
    let passwd = crypto.createHmac('sha256', secretoProhibido).update(password).digest('hex');
    const fecha_nacimiento = req.body.fecha_nacimiento;
    const dni = req.body.dni;
    const rol = req.body.rol;
    let query = `insert into usuarios (nombre, apellidos, nombre_usuario, password, fecha_nacimiento, DNI, rol) values ("${nombre_real}", "${apellidos}", "${username}", "${passwd}", "${fecha_nacimiento}", "${dni}", "${rol}")`;

    if (password != password_repe) {

        req.flash("error", "Las contraseñas no coinciden.");
        req.flash("nombre_real", nombre_real);
        req.flash("apellidos", apellidos);
        req.flash("username", username);
        req.flash("password", password);
        req.flash("password_repe", password_repe);
        req.flash("fecha_nacimiento", fecha_nacimiento);
        req.flash("dni", dni);
        return res.redirect(uri);

    } else {

        connection.query(query, (err, results) => {
            if (err) {
                console.log(err.message);
                req.flash("error", err.message);
                req.flash("nombre_real", nombre_real);
                req.flash("apellidos", apellidos);
                req.flash("username", username);
                req.flash("password", password);
                req.flash("password_repe", password_repe);
                req.flash("fecha_nacimiento", fecha_nacimiento);
                req.flash("dni", dni);
                return res.redirect(uri);
            }
            console.log('Row inserted:' + results.affectedRows);
            req.flash("exito", "Usuario creado correctamente");
            return res.redirect(uri);

        });
    }
});

app.get('/update_user', function (req, res) {
    const query = `select * from usuarios`;
    console.log(req.session.loggedin);
    if (req.session.loggedin) {
        if (req.session.rol == "Administrador") {
            connection.query(query, (err, results) => {
                if (err) {
                    console.log(err.message);
                }

                res.render('update_user.ejs', { title: 'Modificar usuario', results: results, user: req.session.username, rol: req.session.rol });
            });
        }
    } else {
        res.redirect("/login");
    }


});

app.post('/update_user', function (req, res) {
    const uri = "/update_user";

    const id_usuario = req.body.id_usuario;
    const nombre_real = req.body.nombre_real;
    const apellidos = req.body.apellidos;
    const password = req.body.password;
    const password_repe = req.body.password_repe;
    let passwd = crypto.createHmac('sha256', secretoProhibido).update(password).digest('hex');
    const fecha_nacimiento = req.body.fecha_nacimiento;
    const dni = req.body.dni;

    let query = `UPDATE usuarios SET nombre = '${nombre_real}', apellidos = '${apellidos}', password = '${passwd}', fecha_nacimiento = "${fecha_nacimiento}", DNI = '${dni}'
                where id_usuario = ${id_usuario}`;

    if (password != password_repe) {

        req.flash("error", "Las contraseñas no coinciden.");
        req.flash("nombre_real", nombre_real);
        req.flash("apellidos", apellidos);
        req.flash("password", password);
        req.flash("password_repe", password_repe);
        req.flash("fecha_nacimiento", fecha_nacimiento);
        req.flash("dni", dni);
        return res.redirect(uri);

    } else {

        connection.query(query, (err, results) => {
            if (err) {
                console.log(err.message);
                req.flash("error", err.message);
                req.flash("nombre_real", nombre_real);
                req.flash("apellidos", apellidos);
                req.flash("password", password);
                req.flash("password_repe", password_repe);
                req.flash("fecha_nacimiento", fecha_nacimiento);
                req.flash("dni", dni);
                return res.redirect(uri);
            }
            console.log('Row modified:' + results.affectedRows);
            req.flash("exito", "Usuario modificado correctamente");
            return res.redirect(uri);

        });
    }
});

app.get('/delete_user', function (req, res) {
    const query = `select * from usuarios`;
    console.log(req.session.loggedin);
    if (req.session.loggedin) {
        if (req.session.rol == "Administrador") {
            connection.query(query, (err, results) => {
                if (err) {
                    console.log(err.message);
                }

                res.render('delete_user.ejs', { title: 'Borrar usuario', results: results, user: req.session.username, rol: req.session.rol });
            });
        }
    } else {
        res.redirect("/login");
    }


});

app.post('/delete_user', function (req, res) {
    const uri = "/delete_user";
    const id_usuario = req.body.id_usuario;

    const query = `delete from usuarios where id_usuario = ${id_usuario}`;

    connection.query(query, (err, results) => {
        if (err) {
            req.flash("error", err.message);
            console.log(err.message);
            return res.redirect(uri);
        }
        req.flash("exito", "Usuario borrado correctamente");
        return res.redirect(uri);
    });

});

app.listen(3000, function () {
    console.log('Aplicación ejemplo, escuchando el puerto 3000!');
});




const requestListener = function (req, res) {
    res.writeHead(200);
    res.end("My first server!");
};


const server = http.createServer(requestListener);
server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});