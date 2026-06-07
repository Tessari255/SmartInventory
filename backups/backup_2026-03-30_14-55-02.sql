--
-- PostgreSQL database dump
--

\restrict kEwdMfCPqzvMPtY7tLZQgiwUzXghebemM0m1gqwhQDZlEJHY1lRthjKGthw1JbM

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: acessorios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.acessorios (
    id integer NOT NULL,
    nome character varying(100) NOT NULL,
    codigo_patrimonio character varying(50) NOT NULL,
    status character varying(20)
);


ALTER TABLE public.acessorios OWNER TO postgres;

--
-- Name: acessorios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.acessorios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.acessorios_id_seq OWNER TO postgres;

--
-- Name: acessorios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.acessorios_id_seq OWNED BY public.acessorios.id;


--
-- Name: requerimentos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.requerimentos (
    id integer NOT NULL,
    solicitante character varying,
    equipamento character varying,
    justificativa character varying,
    status character varying,
    motivo_rejeicao character varying
);


ALTER TABLE public.requerimentos OWNER TO postgres;

--
-- Name: requerimentos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.requerimentos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.requerimentos_id_seq OWNER TO postgres;

--
-- Name: requerimentos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.requerimentos_id_seq OWNED BY public.requerimentos.id;


--
-- Name: reservas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reservas (
    id integer NOT NULL,
    usuario_id integer,
    acessorio_id integer,
    data_reserva timestamp without time zone NOT NULL,
    horario_inicio time without time zone NOT NULL,
    horario_fim time without time zone NOT NULL,
    status_reserva character varying(20)
);


ALTER TABLE public.reservas OWNER TO postgres;

--
-- Name: reservas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reservas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reservas_id_seq OWNER TO postgres;

--
-- Name: reservas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reservas_id_seq OWNED BY public.reservas.id;


--
-- Name: reservas_oficial; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reservas_oficial (
    id integer NOT NULL,
    solicitante character varying,
    equipamento character varying,
    data_reserva character varying,
    devolvido boolean
);


ALTER TABLE public.reservas_oficial OWNER TO postgres;

--
-- Name: reservas_oficial_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reservas_oficial_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reservas_oficial_id_seq OWNER TO postgres;

--
-- Name: reservas_oficial_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reservas_oficial_id_seq OWNED BY public.reservas_oficial.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nome character varying(100) NOT NULL,
    matricula character varying(20) NOT NULL,
    email character varying(100) NOT NULL,
    senha_hash character varying(255) NOT NULL,
    perfil character varying(20) NOT NULL,
    possui_pendencia boolean,
    data_criacao timestamp without time zone
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_seq OWNER TO postgres;

--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: acessorios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acessorios ALTER COLUMN id SET DEFAULT nextval('public.acessorios_id_seq'::regclass);


--
-- Name: requerimentos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.requerimentos ALTER COLUMN id SET DEFAULT nextval('public.requerimentos_id_seq'::regclass);


--
-- Name: reservas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservas ALTER COLUMN id SET DEFAULT nextval('public.reservas_id_seq'::regclass);


--
-- Name: reservas_oficial id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservas_oficial ALTER COLUMN id SET DEFAULT nextval('public.reservas_oficial_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Data for Name: acessorios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.acessorios (id, nome, codigo_patrimonio, status) FROM stdin;
1	Datashow Epson Sala 01	PAT-2026-001	Disponivel
2	Carregador	1557040	Disponivel
3	notebook	45582240	Disponivel
4	Cabo HDMI 5m	PAT-2026-7360	Disponivel
5	Cabo HDMI 5m	PAT-2026-5085	Disponivel
6	Cabo HDMI 5m	PAT-2026-9142	Disponivel
7	notebook	PAT-2026-5199	Disponivel
8	notebook	PAT-2026-4586	Disponivel
9	Mouse	PAT-2026-5015	Disponível
\.


--
-- Data for Name: requerimentos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.requerimentos (id, solicitante, equipamento, justificativa, status, motivo_rejeicao) FROM stdin;
1	Gabriel Tessari de Andrade	Notebook	Aluunos	Aprovado	\N
2	Gabriel Tessari de Andrade	Mouse	Aluno quebrou Mouse do lab 01	Aprovado	\N
3	Gabriel Tessari de Andrade	Mouse	.	Recusado	n quero
\.


--
-- Data for Name: reservas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reservas (id, usuario_id, acessorio_id, data_reserva, horario_inicio, horario_fim, status_reserva) FROM stdin;
\.


--
-- Data for Name: reservas_oficial; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reservas_oficial (id, solicitante, equipamento, data_reserva, devolvido) FROM stdin;
1	Gabriel Tessari de Andrade	Laboratório de Redes	2026-03-28	f
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id, nome, matricula, email, senha_hash, perfil, possui_pendencia, data_criacao) FROM stdin;
1	Gabriel	123456	gabriel@teste.com	123	Admin	f	2026-03-24 19:40:33.310762
2	Gabriel Tessari de Andrade	PROF-001	Gabriel@fatec.edu.br	123	Professor	f	2026-03-25 12:50:35.78617
3	João Silva	ALUNO-999	Gabriel@aluno.com	123	Aluno	f	2026-03-25 12:51:29.18193
5	Tessari	ALUNO-998	Tessari@aluno.com	123	Aluno	f	2026-03-25 12:53:24.196463
\.


--
-- Name: acessorios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.acessorios_id_seq', 9, true);


--
-- Name: requerimentos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.requerimentos_id_seq', 3, true);


--
-- Name: reservas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reservas_id_seq', 1, false);


--
-- Name: reservas_oficial_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reservas_oficial_id_seq', 1, true);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 5, true);


--
-- Name: acessorios acessorios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acessorios
    ADD CONSTRAINT acessorios_pkey PRIMARY KEY (id);


--
-- Name: requerimentos requerimentos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.requerimentos
    ADD CONSTRAINT requerimentos_pkey PRIMARY KEY (id);


--
-- Name: reservas_oficial reservas_oficial_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservas_oficial
    ADD CONSTRAINT reservas_oficial_pkey PRIMARY KEY (id);


--
-- Name: reservas reservas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservas
    ADD CONSTRAINT reservas_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: ix_acessorios_codigo_patrimonio; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_acessorios_codigo_patrimonio ON public.acessorios USING btree (codigo_patrimonio);


--
-- Name: ix_acessorios_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_acessorios_id ON public.acessorios USING btree (id);


--
-- Name: ix_requerimentos_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_requerimentos_id ON public.requerimentos USING btree (id);


--
-- Name: ix_reservas_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_reservas_id ON public.reservas USING btree (id);


--
-- Name: ix_reservas_oficial_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_reservas_oficial_id ON public.reservas_oficial USING btree (id);


--
-- Name: ix_usuarios_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_usuarios_email ON public.usuarios USING btree (email);


--
-- Name: ix_usuarios_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_usuarios_id ON public.usuarios USING btree (id);


--
-- Name: ix_usuarios_matricula; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_usuarios_matricula ON public.usuarios USING btree (matricula);


--
-- Name: reservas reservas_acessorio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservas
    ADD CONSTRAINT reservas_acessorio_id_fkey FOREIGN KEY (acessorio_id) REFERENCES public.acessorios(id);


--
-- Name: reservas reservas_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservas
    ADD CONSTRAINT reservas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- PostgreSQL database dump complete
--

\unrestrict kEwdMfCPqzvMPtY7tLZQgiwUzXghebemM0m1gqwhQDZlEJHY1lRthjKGthw1JbM

