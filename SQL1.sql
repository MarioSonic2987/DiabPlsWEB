drop database DIABPLS;

create database IF NOT EXISTS DIABPLS;

create table IF NOT EXISTS diabpls.usuarios (id_usuario INTEGER AUTO_INCREMENT,
	PRIMARY KEY (id_usuario),
	nombre varchar(50) NOT NULL,
	apellidos varchar(50) NOT NULL,
	nombre_usuario varchar(50) NOT NULL UNIQUE,
    password varchar(255) NOT NULL,
	fecha_nacimiento date,
	DNI varchar(9) NOT NULL,
	rol varchar(20) 
);

insert into diabpls.usuarios (nombre, apellidos, nombre_usuario, password, fecha_nacimiento, DNI, rol) values ("Administrador", "1", "admin", "604409fa8ae5e7348911400fb20a1b391d12eb576bfb071c043f757a4b2c18e0", "1999/01/17", "73472065Z", "Administrador");

select *
from diabpls.datos_pacientes;

select *
from diabpls.usuarios;

create table IF NOT EXISTS diabpls.datos_pacientes (
	id_dia int PRIMARY KEY AUTO_INCREMENT,
    id_paciente INT not null,
    INDEX id_pac (id_paciente),
    FOREIGN KEY (id_paciente)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE,
	fecha_hora datetime DEFAULT CURRENT_TIMESTAMP,
	sensibilidad int not null,
	glucosa int not null,
	hidratos float not null,
	insulina float not null,
    comentario varchar(255)
);
