import type { Testimonial } from "@/components/ui/testimonials";

// Síntesis (paráfrasis, no citas textuales) de lo que plantean guías y organismos de referencia.
// Verificar la versión vigente de cada fuente antes de citarla en la entrega.
// Cuando el equipo entreviste a especialistas (Protección Civil, académicos de hidrología, etc.),
// agregar aquí su opinión con nombre y cargo, con su permiso.
export const EXPERTOS: Testimonial[] = [
  {
    initials: "UN",
    name: "UNDRR · ONU",
    username: "Marco de Sendai 2015-2030",
    text: "Un sistema de alerta temprana funciona solo si reúne cuatro piezas: conocer el riesgo, monitorear y pronosticar, hacer llegar la alerta a la gente y que la gente sepa cómo responder. Una alerta sin comunidad preparada no reduce daños.",
    social: "https://www.undrr.org/",
    tag: "Alerta temprana centrada en las personas",
  },
  {
    initials: "OMM",
    name: "Organización Meteorológica Mundial",
    username: "Alertas Tempranas para Todos",
    text: "La iniciativa de Naciones Unidas busca que toda persona del planeta esté protegida por un sistema de alerta temprana. Medir, avisar a tiempo y preparar a la población es de las medidas de adaptación con mejor retorno.",
    social: "https://wmo.int/activities/early-warnings-all",
    tag: "Adaptación al clima",
  },
  {
    initials: "SuDS",
    name: "CIRIA",
    username: "The SuDS Manual (C753)",
    text: "El drenaje sostenible maneja la lluvia cerca de donde cae, imitando el drenaje natural. Se diseña para controlar la cantidad de agua, mejorar su calidad y además dar espacio público y biodiversidad a la comunidad.",
    social: "https://www.ciria.org/",
    tag: "Drenaje urbano sostenible",
  },
  {
    initials: "EPA",
    name: "U.S. EPA",
    username: "Infraestructura verde",
    text: "La infraestructura verde reduce y trata el agua pluvial en su origen con suelo y plantas, y a la vez aporta beneficios ambientales, sociales y económicos que el drenaje gris por sí solo no da.",
    social: "https://www.epa.gov/green-infrastructure",
    tag: "Manejo de agua pluvial",
  },
  {
    initials: "OMS",
    name: "Organización Mundial de la Salud",
    username: "Dengue",
    text: "El mosquito que transmite el dengue se cría en agua estancada. Eliminar criaderos y vigilar con la comunidad es la base de la prevención, por eso un bordo debe drenar a tiempo.",
    social: "https://www.who.int/es/news-room/fact-sheets/detail/dengue-and-severe-dengue",
    tag: "Salud pública",
  },
  {
    initials: "PC",
    name: "CENAPRED · Protección Civil",
    username: "Prevención ante inundaciones",
    text: "Tener un plan familiar, conocer la ruta de evacuación y no cruzar corrientes de agua salva vidas. La preparación antes de la temporada de lluvias es tan importante como la obra.",
    social: "https://www.gob.mx/cenapred",
    tag: "Protección civil",
  },
];
